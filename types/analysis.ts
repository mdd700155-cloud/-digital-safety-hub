export type RiskLevel = "SAFE" | "SUSPICIOUS" | "HIGH_RISK";
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";
export type InputType = "message" | "url" | "screenshot" | "qr";

export interface ThreatIntel {
  source: string;
  match: boolean;
  details?: string;
  tags?: string[];
  url_status?: string;
}

export interface AnalysisResult {
  level: RiskLevel;
  confidence: ConfidenceLevel;
  summary: string;
  warningIndicators: string[];
  recommendations: string[];
  signals: string[];
  threatIntel?: ThreatIntel;
}

export interface AnalyzeRequest {
  type: InputType;
  content: string; // URL string, message text, or base64 image
}
