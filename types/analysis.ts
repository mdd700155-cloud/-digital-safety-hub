import { EmailAnalysisResult } from "./emailAnalysis";

export type RiskLevel = "SAFE" | "SUSPICIOUS" | "HIGH_RISK";
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";
export type InputType = "message" | "url" | "screenshot" | "qr" | "email";

export interface ThreatIntel {
  source: string;
  match: boolean;
  details?: string;
  tags?: string[];
  url_status?: string;
}

// ── Pipeline Trace ─────────────────────────────────────────────────────

export type StageStatus = "pass" | "flagged" | "clean" | "skipped" | "error" | "unavailable";

export interface StageVerdict {
  stage: string;
  status: StageStatus;
  detail?: string;
  durationMs?: number;
}

export interface PipelineTrace {
  inputType: string;
  stages: StageVerdict[];
  totalDurationMs: number;
}

// ── Analysis Result ────────────────────────────────────────────────────

export interface AnalysisResult {
  level: RiskLevel;
  confidence: ConfidenceLevel;
  summary: string;
  warningIndicators: string[];
  recommendations: string[];
  signals: string[];
  threatIntel?: ThreatIntel;
  pipelineTrace?: PipelineTrace;
  emailAnalysis?: EmailAnalysisResult;
}

export interface AnalyzeRequest {
  type: InputType;
  content: string; // URL string, message text, base64 image, or raw email headers
}
