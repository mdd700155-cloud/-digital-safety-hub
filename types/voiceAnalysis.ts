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
