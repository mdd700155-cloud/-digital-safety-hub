import { RiskLevel, ConfidenceLevel, ThreatIntel, AnalysisResult } from "@/types/analysis";

interface AggregationInput {
  heuristicSignals: string[];
  threatIntel?: ThreatIntel;
  geminiRiskLevel?: RiskLevel;
  geminiSignals: string[];
  geminiRecommendations: string[];
  geminiSummary: string;
}

export function aggregateRisk(input: AggregationInput): AnalysisResult {
  const { heuristicSignals, threatIntel, geminiRiskLevel, geminiSignals, geminiRecommendations, geminiSummary } = input;
  
  let finalRiskLevel: RiskLevel = "SAFE";
  let confidence: ConfidenceLevel = "MEDIUM";
  
  const allSignals = [...heuristicSignals, ...geminiSignals];
  
  // 1. Highest precedence: Known Threat Intel (URLhaus)
  if (threatIntel?.match) {
    finalRiskLevel = "HIGH_RISK";
    confidence = "HIGH";
    allSignals.unshift(`Verified Threat: ${threatIntel.details}`);
  } 
  else {
    // 2. Evaluate Heuristics and Gemini consensus
    let heuristicScore = 0;
    if (heuristicSignals.length >= 3) {
      heuristicScore = 2; // High suspicion based on structure
    } else if (heuristicSignals.length > 0) {
      heuristicScore = 1; // Mild suspicion
    }

    if (geminiRiskLevel === "HIGH_RISK") {
      finalRiskLevel = heuristicScore >= 1 ? "HIGH_RISK" : "SUSPICIOUS";
      confidence = heuristicScore >= 1 ? "HIGH" : "MEDIUM";
    } else if (geminiRiskLevel === "SUSPICIOUS") {
      finalRiskLevel = heuristicScore >= 2 ? "HIGH_RISK" : "SUSPICIOUS";
      confidence = "MEDIUM";
    } else {
      // Gemini says SAFE
      finalRiskLevel = heuristicScore >= 2 ? "SUSPICIOUS" : "SAFE";
      confidence = heuristicScore >= 2 ? "LOW" : "HIGH";
    }
  }

  // Ensure summary is appropriate for the final determined level
  let summary = geminiSummary;
  if (finalRiskLevel === "SAFE" && !threatIntel?.match && heuristicSignals.length === 0) {
     summary = summary || "No obvious threat indicators detected.";
  }
  
  return {
    level: finalRiskLevel,
    confidence,
    summary: summary || "Analysis complete.",
    warningIndicators: allSignals.filter((v, i, a) => a.indexOf(v) === i), // Deduplicate
    recommendations: geminiRecommendations.length > 0 ? geminiRecommendations : [
      finalRiskLevel === "SAFE" ? "Proceed with normal caution." : "Do not interact with this content.",
      "If you provided sensitive information, monitor your accounts."
    ],
    signals: heuristicSignals,
    threatIntel
  };
}
