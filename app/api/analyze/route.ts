import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/validation/analyze";
import { analyzeContent } from "@/lib/orchestrator/orchestrator";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = analyzeRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { type, content, language } = validationResult.data;

    // Call the unified orchestrator
    const result = await analyzeContent({ content, type });

<<<<<<< HEAD
    // 1. Initial Routing and Deterministic Analysis
    if (type === "url") {
      urlsToAnalyze.push(content);
    } else if (type === "message" || type === "qr") {
      // For QR: determine if content is a URL or plain text
      const isQrUrl = type === "qr" && /^https?:\/\//i.test(content.trim());
      if (isQrUrl) {
        urlsToAnalyze.push(content);
      } else {
        const msgResult = analyzeMessage(content);
        finalHeuristicSignals.push(...msgResult.signals);
        if (msgResult.extractedUrls.length > 0) {
          urlsToAnalyze.push(...msgResult.extractedUrls);
        }
      }
    } else if (type === "screenshot") {
      if (!content.startsWith("data:image/")) {
        return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
      }
      const [header, base64Data] = content.split(",");
      const mimeType = header.replace("data:", "").replace(";base64", "");

      try {
        geminiResult = await analyzeImageWithGemini(base64Data, mimeType, language);
        if (!geminiResult) {
          geminiStatus = "FAILED";
          console.log("[Security] Gemini analysis: FAILED");
          // Fail gracefully instead of crashing
          return NextResponse.json({
            level: "SAFE",
            confidence: "LOW",
            summary: "Image analysis could not be completed. Try checking the URL or message text directly.",
            warningIndicators: [],
            recommendations: ["If you suspect this image contains a scam, try extracting the text or URL and checking it separately."],
            signals: [],
          });
        }
        geminiStatus = "SUCCESS";
        console.log("[Security] Gemini analysis: SUCCESS");
      } catch (e) {
        geminiStatus = "FAILED";
        console.log("[Security] Gemini analysis: FAILED");
        return NextResponse.json({
          level: "SAFE",
          confidence: "LOW",
          summary: "Image analysis could not be completed. Try checking the URL or message text directly.",
          warningIndicators: [],
          recommendations: ["If you suspect this image contains a scam, try extracting the text or URL and checking it separately."],
          signals: [],
        });
      }

      // Any URLs Gemini extracted from the screenshot must be treated as untrusted data
      // and validated + normalized before passing to URL pipeline
      if (geminiResult.extractedUrls && geminiResult.extractedUrls.length > 0) {
        for (const extractedUrl of geminiResult.extractedUrls) {
          // Validate and normalize before trusting
          const trimmed = extractedUrl.trim();
          if (trimmed && (trimmed.startsWith("http") || trimmed.startsWith("www."))) {
            urlsToAnalyze.push(trimmed);
            break; // Only analyze the first extracted URL
          }
        }
      }
    }

    // 2. URL Pipeline (if any URLs exist in input, message, screenshot, or decoded QR)
    if (urlsToAnalyze.length > 0) {
      const targetUrl = urlsToAnalyze[0];
      const urlResult = analyzeUrl(targetUrl);

      // Collect both plain strings (for display) and weighted signals (for aggregator)
      finalHeuristicSignals.push(...urlResult.signalMessages);
      finalWeightedSignals = urlResult.signals;

      // ML-based URL classification (optional signal)
      try {
        const ml = await classifyUrl(targetUrl);
        if (ml && ml.available) {
          mlStatus = "SUCCESS";
          console.log("[Security] ML URL classifier: SUCCESS");
        } else {
          mlStatus = "UNAVAILABLE";
          console.log("[Security] ML URL classifier: UNAVAILABLE");
        }
        if (ml && ml.signal) {
          finalHeuristicSignals.push(
            `[ML] ${ml.signal} (model v${ml.modelVersion ?? "unknown"})`
          );
          // Map ML categorical signal into a conservative weighted signal
          if (ml.signal === "HIGH_RISK_SIGNAL") {
            finalWeightedSignals.push({
              message: `ML model indicates multiple URL characteristics associated with phishing (v${ml.modelVersion ?? "unknown"})`,
              weight: "MODERATE",
            });
          } else if (ml.signal === "SUSPICIOUS_SIGNAL") {
            finalWeightedSignals.push({
              message: `ML model flags this URL as suspicious (v${ml.modelVersion ?? "unknown"})`,
              weight: "WEAK",
            });
          }
        }
      } catch (e) {
        mlStatus = "UNAVAILABLE";
        console.log("[Security] ML URL classifier: UNAVAILABLE");
        // Fail open: missing or broken ML model should not block analysis
      }

      // Threat Intel Lookup (only if URL is parseable)
      if (!urlResult.isMalformed && urlResult.normalizedUrl) {
        try {
          const intel = await checkUrlhaus(urlResult.normalizedUrl);
          if (intel) {
            finalThreatIntel = intel;
            urlhausStatus = "SUCCESS";
            console.log("[Security] URLhaus lookup: SUCCESS");
          } else {
            urlhausStatus = "FAILED";
            console.log("[Security] URLhaus lookup: FAILED");
          }
        } catch (e) {
          urlhausStatus = "FAILED";
          console.log("[Security] URLhaus lookup: FAILED");
        }
      }
    }

    // 3. Gemini Contextual Analysis (if not already done via screenshot)
    if (type !== "screenshot") {
      try {
        geminiResult = await analyzeWithGemini(
          content,
          type === "url" || (type === "qr" && urlsToAnalyze.length > 0) ? "url" : "message",
          finalHeuristicSignals,
          finalThreatIntel?.match,
          language
        );
        if (geminiResult) {
          geminiStatus = "SUCCESS";
          console.log("[Security] Gemini analysis: SUCCESS");
        } else {
          geminiStatus = "FAILED";
          console.log("[Security] Gemini analysis: FAILED");
        }
      } catch (e) {
        geminiStatus = "FAILED";
        console.log("[Security] Gemini analysis: FAILED");
      }
    }

    // Fallback if Gemini fails entirely
    if (!geminiResult) {
      return NextResponse.json(
        aggregateRisk({
          heuristicSignals: finalHeuristicSignals,
          weightedSignals: finalWeightedSignals,
          threatIntel: finalThreatIntel,
          geminiSignals: [],
          geminiRecommendations: [
            "AI analysis was unavailable. Results are based on structural signals only.",
            "If this looks suspicious, do not interact with it.",
          ],
          geminiSummary:
            "Analyzed using structural heuristics and threat intelligence only. AI analysis was unavailable.",
          geminiRiskLevel: "SAFE", // Aggregator will upgrade based on heuristicScore
          language,
        })
      );
    }

    // 4. Aggregation
    try {
      console.log(
        `[Security] Analysis complete | ML: ${mlStatus} | URLhaus: ${urlhausStatus} | Gemini: ${geminiStatus}`
      );
    } catch (e) {
      // ignore logging errors
    }

    const finalResult = aggregateRisk({
      heuristicSignals: finalHeuristicSignals,
      weightedSignals: finalWeightedSignals,
      threatIntel: finalThreatIntel,
      geminiRiskLevel: geminiResult.riskLevel,
      geminiSignals: geminiResult.signals,
      geminiRecommendations: geminiResult.recommendations,
      geminiSummary: geminiResult.summary,
      language,
    });

    return NextResponse.json(finalResult);
=======
    return NextResponse.json(result);
>>>>>>> origin/saad2
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
