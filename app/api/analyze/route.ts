import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/validation/analyze";
import { analyzeUrl } from "@/lib/security/urlAnalyzer";
import { analyzeMessage } from "@/lib/security/messageAnalyzer";
import { checkUrlhaus } from "@/lib/security/urlhaus";
import { aggregateRisk } from "@/lib/security/aggregator";
import { analyzeWithGemini, analyzeImageWithGemini } from "@/lib/ai/gemini";
import { ThreatIntel } from "@/types/analysis";
import { UrlSignal } from "@/lib/security/urlAnalyzer";

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

    const { type, content } = validationResult.data;

    const finalHeuristicSignals: string[] = [];
    let finalWeightedSignals: UrlSignal[] = [];
    let finalThreatIntel: ThreatIntel | undefined = undefined;
    let geminiResult = null;
    const urlsToAnalyze: string[] = [];

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

      geminiResult = await analyzeImageWithGemini(base64Data, mimeType);

      if (!geminiResult) {
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

      // Threat Intel Lookup (only if URL is parseable)
      if (!urlResult.isMalformed && urlResult.normalizedUrl) {
        const intel = await checkUrlhaus(urlResult.normalizedUrl);
        if (intel) {
          finalThreatIntel = intel;
        }
      }
    }

    // 3. Gemini Contextual Analysis (if not already done via screenshot)
    if (type !== "screenshot") {
      geminiResult = await analyzeWithGemini(
        content,
        type === "url" || (type === "qr" && urlsToAnalyze.length > 0) ? "url" : "message",
        finalHeuristicSignals,
        finalThreatIntel?.match
      );
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
        })
      );
    }

    // 4. Aggregation
    const finalResult = aggregateRisk({
      heuristicSignals: finalHeuristicSignals,
      weightedSignals: finalWeightedSignals,
      threatIntel: finalThreatIntel,
      geminiRiskLevel: geminiResult.riskLevel,
      geminiSignals: geminiResult.signals,
      geminiRecommendations: geminiResult.recommendations,
      geminiSummary: geminiResult.summary,
    });

    return NextResponse.json(finalResult);
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
