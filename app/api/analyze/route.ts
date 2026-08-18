import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/validation/analyze";
import { analyzeUrl } from "@/lib/security/urlAnalyzer";
import { analyzeMessage } from "@/lib/security/messageAnalyzer";
import { checkUrlhaus } from "@/lib/security/urlhaus";
import { aggregateRisk } from "@/lib/security/aggregator";
import { analyzeWithGemini, analyzeImageWithGemini } from "@/lib/ai/gemini";
import { ThreatIntel } from "@/types/analysis";

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
    let finalThreatIntel: ThreatIntel | undefined = undefined;
    let geminiResult = null;
    const urlsToAnalyze: string[] = [];

    // 1. Initial Routing and Deterministic Analysis
    if (type === "url") {
      urlsToAnalyze.push(content);
    } 
    else if (type === "message" || type === "qr") { // Treat text QR the same as message initially
      const msgResult = analyzeMessage(content);
      finalHeuristicSignals.push(...msgResult.signals);
      if (msgResult.extractedUrls.length > 0) {
        urlsToAnalyze.push(...msgResult.extractedUrls);
      }
    } 
    else if (type === "screenshot") {
      // Need to extract base64. Ensure it's valid format.
      // Expected: data:image/png;base64,iVBORw0KGgo...
      if (!content.startsWith("data:image/")) {
        return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
      }
      const [header, base64Data] = content.split(",");
      const mimeType = header.replace("data:", "").replace(";base64", "");
      
      geminiResult = await analyzeImageWithGemini(base64Data, mimeType);
      
      if (!geminiResult) {
        return NextResponse.json({ error: "Image analysis failed." }, { status: 500 });
      }
      
      if (geminiResult.extractedUrls && geminiResult.extractedUrls.length > 0) {
        urlsToAnalyze.push(...geminiResult.extractedUrls);
      }
    }

    // 2. URL Pipeline (if any URLs exist in input, message, or screenshot)
    // We only take the first extracted URL to avoid DOSing URLhaus and Gemini
    if (urlsToAnalyze.length > 0) {
      const targetUrl = urlsToAnalyze[0];
      const urlResult = analyzeUrl(targetUrl);
      
      finalHeuristicSignals.push(...urlResult.signals);

      // Threat Intel Lookup if not malformed
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
        type === "url" ? "url" : "message",
        finalHeuristicSignals,
        finalThreatIntel?.match
      );
    }

    // Fallback if Gemini fails entirely but we have heuristics
    if (!geminiResult) {
       // Return a degraded but functional result based solely on deterministic checks
       return NextResponse.json(aggregateRisk({
         heuristicSignals: finalHeuristicSignals,
         threatIntel: finalThreatIntel,
         geminiSignals: [],
         geminiRecommendations: ["Analysis limited due to AI provider unavailability."],
         geminiSummary: "Analyzed using local deterministic rules and threat intelligence.",
         geminiRiskLevel: "SAFE" // Let aggregator upgrade based on heuristicScore
       }));
    }

    // 4. Aggregation
    const finalResult = aggregateRisk({
      heuristicSignals: finalHeuristicSignals,
      threatIntel: finalThreatIntel,
      geminiRiskLevel: geminiResult.riskLevel,
      geminiSignals: geminiResult.signals,
      geminiRecommendations: geminiResult.recommendations,
      geminiSummary: geminiResult.summary
    });

    return NextResponse.json(finalResult);

  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
