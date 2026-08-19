export type DeepfakeImageRiskLevel =
  | "LIKELY_AUTHENTIC"
  | "UNCERTAIN"
  | "LIKELY_SYNTHETIC";

export interface DeepfakeImageFeatureScore {
  name: string;
  score: number; // 0-100 (higher = more synthetic)
  weight: number;
  explanation: string;
  category: "texture" | "noise" | "compression";
}

export interface DeepfakeImageGeminiAssessment {
  probability: number;
  riskLevel: DeepfakeImageRiskLevel;
  reasoning: string;
  observations: string[];
}

export interface ImageMetadata {
  fileType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  processingStatus: "COMPLETED" | "AI_UNAVAILABLE" | "FAILED";
}

export interface DeepfakeImageAnalysisResult {
  type: "deepfake-image";
  probability: number;
  riskLevel: DeepfakeImageRiskLevel;
  featureScores: DeepfakeImageFeatureScore[];
  geminiAssessment?: DeepfakeImageGeminiAssessment;
  summary: string;
  recommendations: string[];
  metadata: ImageMetadata;
  aiUsed: boolean;
  disclaimer: string;
}
