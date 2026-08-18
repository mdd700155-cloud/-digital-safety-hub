/**
 * Risk Aggregator — Central Decision Engine
 *
 * Philosophy:
 *   - Strong trusted evidence (URLhaus match, STRONG-weight signals) → HIGH_RISK
 *   - Multiple meaningful independent signals (MODERATE) → SUSPICIOUS
 *   - Only weak/common signals alone → SAFE (no obvious threat)
 *   - Gemini alone cannot declare HIGH_RISK without corroborating heuristic evidence
 *   - Confidence reflects quality and agreement of evidence, not Gemini's own self-report
 */

import { RiskLevel, ConfidenceLevel, ThreatIntel, AnalysisResult } from "@/types/analysis";
import { UrlSignal } from "./urlAnalyzer";

interface AggregationInput {
  heuristicSignals: string[];       // Simple string list for display
  weightedSignals?: UrlSignal[];     // Structured weighted signals from URL analyzer
  threatIntel?: ThreatIntel;
  geminiRiskLevel?: RiskLevel;
  geminiSignals: string[];
  geminiRecommendations: string[];
  geminiSummary: string;
}

function computeHeuristicScore(weightedSignals: UrlSignal[], plainSignals: string[]): number {
  if (weightedSignals.length > 0) {
    // Use weighted scoring
    return weightedSignals.reduce((score, s) => {
      if (s.weight === "STRONG") return score + 3;
      if (s.weight === "MODERATE") return score + 2;
      return score + 0.5; // WEAK signals barely contribute
    }, 0);
  }
  // Fallback for message/screenshot plain signals
  return plainSignals.length * 1.5;
}

export function aggregateRisk(input: AggregationInput): AnalysisResult {
  const {
    heuristicSignals,
    weightedSignals = [],
    threatIntel,
    geminiRiskLevel,
    geminiSignals,
    geminiRecommendations,
    geminiSummary,
  } = input;

  let finalRiskLevel: RiskLevel = "SAFE";
  let confidence: ConfidenceLevel = "MEDIUM";

  const allSignals = [...heuristicSignals, ...geminiSignals].filter((v, i, a) => a.indexOf(v) === i);

  // ── TIER 1: Verified Threat Intelligence ─────────────────────────────
  if (threatIntel?.match) {
    finalRiskLevel = "HIGH_RISK";
    confidence = "HIGH";
  }
  // ── TIER 2: Strong Heuristic Evidence ────────────────────────────────
  else {
    const heuristicScore = computeHeuristicScore(weightedSignals, heuristicSignals);

    // Strong heuristic signals: HIGH_RISK only if Gemini agrees or score is very high
    const hasStrongHeuristic = weightedSignals.some((s) => s.weight === "STRONG");
    const hasManyModerate =
      weightedSignals.filter((s) => s.weight === "MODERATE").length >= 2;

    if (hasStrongHeuristic && geminiRiskLevel !== "SAFE") {
      // Strong heuristic + Gemini not clear → HIGH_RISK
      finalRiskLevel = "HIGH_RISK";
      confidence = "HIGH";
    } else if (hasStrongHeuristic) {
      // Strong heuristic but Gemini says safe — be conservative
      finalRiskLevel = "SUSPICIOUS";
      confidence = "MEDIUM";
    } else if (geminiRiskLevel === "HIGH_RISK") {
      // Gemini alone says HIGH_RISK — require meaningful heuristic corroboration
      if (heuristicScore >= 4) {
        finalRiskLevel = "HIGH_RISK";
        confidence = "MEDIUM";
      } else if (heuristicScore >= 1.5) {
        finalRiskLevel = "SUSPICIOUS";
        confidence = "MEDIUM";
      } else {
        // No heuristic corroboration — downgrade Gemini's strong claim
        finalRiskLevel = "SUSPICIOUS";
        confidence = "LOW";
      }
    } else if (geminiRiskLevel === "SUSPICIOUS") {
      if (hasManyModerate || heuristicScore >= 4) {
        finalRiskLevel = "SUSPICIOUS";
        confidence = "MEDIUM";
      } else if (heuristicScore >= 1.5) {
        finalRiskLevel = "SUSPICIOUS";
        confidence = "LOW";
      } else {
        // Only weak heuristics + Gemini is suspicious → inconclusive, lean safe
        finalRiskLevel = "SAFE";
        confidence = "LOW";
      }
    } else {
      // Gemini says SAFE
      if (heuristicScore >= 4) {
        // Many heuristic signals even though Gemini is okay — flag as suspicious
        finalRiskLevel = "SUSPICIOUS";
        confidence = "LOW";
      } else {
        finalRiskLevel = "SAFE";
        confidence = heuristicScore === 0 ? "HIGH" : "MEDIUM";
      }
    }
  }

  // ── Build the user-facing summary ─────────────────────────────────────
  let summary = geminiSummary;
  if (finalRiskLevel === "SAFE") {
    // Ensure we don't claim "safe" outright — prefer honest "no obvious threat" phrasing
    if (!summary || summary.toLowerCase().includes("safe")) {
      summary =
        heuristicSignals.length === 0 && !threatIntel
          ? "No obvious threat indicators detected. This does not guarantee the content is safe."
          : "We detected some minor patterns, but no strong threat evidence. Proceed with caution.";
    }
  }

  // Build ordered warning indicators: threat intel first, then strong, then moderate, then weak
  const orderedIndicators = [
    ...(threatIntel?.match
      ? [
          `⚠ URLhaus reports this URL as associated with malware distribution (source: URLhaus/abuse.ch)${
            threatIntel.url_status ? ` — status: ${threatIntel.url_status}` : ""
          }`,
        ]
      : []),
    ...allSignals,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const defaultRecommendations =
    finalRiskLevel === "SAFE"
      ? ["Proceed with normal caution.", "Never share passwords or OTPs with anyone."]
      : [
          "Do not click links or provide personal information.",
          "If you have already shared sensitive data, contact your bank immediately.",
          "Report the incident at cybercrime.gov.in or call 1930.",
        ];

  return {
    level: finalRiskLevel,
    confidence,
    summary: summary || "Analysis complete.",
    warningIndicators: orderedIndicators,
    recommendations: geminiRecommendations.length > 0 ? geminiRecommendations : defaultRecommendations,
    signals: heuristicSignals,
    threatIntel,
  };
}
