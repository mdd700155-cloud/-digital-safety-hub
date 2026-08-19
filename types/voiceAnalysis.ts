import { RiskLevel, ConfidenceLevel } from "@/types/analysis";

export type ScamCategory =
  | "BANK_UPI_FRAUD"
  | "OTP_THEFT"
  | "FAKE_CUSTOMER_SUPPORT"
  | "DIGITAL_ARREST"
  | "FAKE_GOVERNMENT"
  | "INVESTMENT_SCAM"
  | "JOB_SCAM"
  | "DELIVERY_SCAM"
  | "ACCOUNT_TAKEOVER"
  | "IMPERSONATION"
  | "OTHER";

export const SCAM_CATEGORY_LABELS: Record<ScamCategory, string> = {
  BANK_UPI_FRAUD: "Bank / UPI Fraud",
  OTP_THEFT: "OTP Theft",
  FAKE_CUSTOMER_SUPPORT: "Fake Customer Support",
  DIGITAL_ARREST: "Digital Arrest / Government Impersonation",
  FAKE_GOVERNMENT: "Fake Police / Government Impersonation",
  INVESTMENT_SCAM: "Investment Scam",
  JOB_SCAM: "Job Scam",
  DELIVERY_SCAM: "Delivery Scam",
  ACCOUNT_TAKEOVER: "Account Takeover",
  IMPERSONATION: "Impersonation",
  OTHER: "Other / Unclear",
};

export type SignalSeverity = "HIGH" | "MEDIUM" | "LOW";

export interface VoiceSignal {
  id: string;
  label: string;
  severity: SignalSeverity;
  /** Computed confidence (0–100) from matched patterns — never fabricated. */
  confidence: number;
  /** Exact snippets from the transcript that triggered this signal. */
  evidence: string[];
  explanation: string;
  recommendation: string;
}

export interface VoiceMetadata {
  durationSeconds: number;
  fileType: string;
  fileSizeBytes: number;
  processingStatus: "COMPLETED" | "AI_UNAVAILABLE" | "FAILED";
}

export interface VoiceAnalysisResult {
  type: "voice";
  level: RiskLevel;
  confidence: ConfidenceLevel;
  scamType: ScamCategory;
  scamTypeUncertain: boolean;
  transcript: string;
  signals: VoiceSignal[];
  summary: string;
  recommendations: string[];
  warningIndicators: string[];
  metadata: VoiceMetadata;
  aiUsed: boolean;
  protectionSteps: string[];
}

/* ── Deepfake / Synthetic Voice Detection ───────────────────────────── */

export type DeepfakeRiskLevel =
  | "LIKELY_AUTHENTIC"
  | "UNCERTAIN"
  | "LIKELY_SYNTHETIC";

export interface DeepfakeFeatureScore {
  /** Feature name (e.g. "Pitch Regularity"). */
  name: string;
  /** Anomaly score 0–100 — higher means more synthetic-sounding. */
  score: number;
  /** Weight this feature carries in the overall score (0–1). */
  weight: number;
  /** Plain-language explanation of what was detected. */
  explanation: string;
  /** Grouping category for display. */
  category: "spectral" | "temporal" | "prosody" | "noise";
}

export interface DeepfakeGeminiAssessment {
  /** Gemini's overall synthetic probability 0–100. */
  probability: number;
  /** Gemini's risk level assessment. */
  riskLevel: DeepfakeRiskLevel;
  /** Gemini's reasoning in plain language. */
  reasoning: string;
  /** Specific observations Gemini made about the audio. */
  observations: string[];
}

export interface DeepfakeAnalysisResult {
  type: "deepfake";
  /** Overall synthetic probability 0–100 (aggregated). */
  probability: number;
  /** Final risk level after aggregation. */
  riskLevel: DeepfakeRiskLevel;
  /** Client-side audio feature scores. */
  featureScores: DeepfakeFeatureScore[];
  /** Gemini AI assessment (may be absent if API is unavailable). */
  geminiAssessment?: DeepfakeGeminiAssessment;
  /** User-facing summary. */
  summary: string;
  /** Actionable recommendations. */
  recommendations: string[];
  /** Audio metadata. */
  metadata: VoiceMetadata;
  /** Whether Gemini AI was used in the analysis. */
  aiUsed: boolean;
  /** Disclaimer about heuristic nature of the analysis. */
  disclaimer: string;
}
