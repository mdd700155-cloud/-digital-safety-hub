/**
 * Orchestrator — Type Definitions
 *
 * Types for the unified analysis orchestrator that routes content
 * to the appropriate pipeline stages and merges their outputs.
 */

import {
  RiskLevel,
  AnalysisResult,
  PipelineTrace,
  StageVerdict,
  InputType,
} from "@/types/analysis";
import { EmailAnalysisResult } from "@/types/emailAnalysis";

// ── Orchestrator Input ─────────────────────────────────────────────────

export interface OrchestratorInput {
  /** The raw content to analyze */
  content: string;
  /** The content type. If omitted, the orchestrator will attempt auto-detection. */
  type?: InputType;
  /** Output language for localized summaries (e.g. "hi", "bn"). Optional, defaults to English. */
  language?: string;
}

// ── Orchestrator Result ────────────────────────────────────────────────

export interface OrchestratorResult extends AnalysisResult {
  pipelineTrace: PipelineTrace;
  emailAnalysis?: EmailAnalysisResult;
}

// ── Re-exports for convenience ─────────────────────────────────────────

export type {
  RiskLevel,
  AnalysisResult,
  PipelineTrace,
  StageVerdict,
  InputType,
  EmailAnalysisResult,
};
