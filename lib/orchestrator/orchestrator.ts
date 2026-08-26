/**
 * Unified Analysis Orchestrator
 *
 * Single entry point that replaces the inline orchestration previously
 * embedded in the API route handler. Routes content to the appropriate
 * pipeline stages based on input type, runs independent stages
 * concurrently, and merges all outputs through the Risk Aggregator.
 *
 * Pipeline stages (all existing — not rewritten, only wrapped):
 *   - Local rules engine (messageAnalyzer)
 *   - URL heuristic analyzer (urlAnalyzer)
 *   - ML URL classifier (mlUrlClassifier)
 *   - URLhaus threat intel (urlhaus)
 *   - Gemini AI analysis (gemini)
 *   - Email forensics (emailAnalyzer) — new, for type "email"
 *   - Risk Aggregator (aggregator) — always the final stage
 */

import { InputType, StageVerdict, PipelineTrace } from "@/types/analysis";
import { OrchestratorInput, OrchestratorResult } from "./types";
import { analyzeUrl, UrlSignal } from "@/lib/security/urlAnalyzer";
import { analyzeMessage } from "@/lib/security/messageAnalyzer";
import { checkUrlhaus } from "@/lib/security/urlhaus";
import { classifyUrl } from "@/lib/security/mlUrlClassifier";
import { analyzeWithGemini, analyzeImageWithGemini } from "@/lib/ai/gemini";
import { aggregateRisk } from "@/lib/security/aggregator";
import { analyzeEmail } from "@/lib/email/emailAnalyzer";
import { ThreatIntel } from "@/types/analysis";
import { EmailAnalysisResult } from "@/types/emailAnalysis";

// ── Auto-detection helpers ─────────────────────────────────────────────

function detectInputType(content: string): InputType {
  const trimmed = content.trim();

  // Base64 image data URL
  if (trimmed.startsWith("data:image/")) {
    return "screenshot";
  }

  // Raw email headers (look for standard email header patterns)
  if (
    /^(From|Received|Return-Path|MIME-Version|Date|Subject|To|Message-ID):/im.test(trimmed) &&
    /^Received:/im.test(trimmed)
  ) {
    return "email";
  }

  // URL (starts with protocol or www)
  if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) {
    return "url";
  }

  // Default: treat as a text message
  return "message";
}

// ── Stage timing helper ────────────────────────────────────────────────

function timedStage(stage: string): { finish: (status: StageVerdict["status"], detail?: string) => StageVerdict } {
  const start = Date.now();
  return {
    finish(status, detail) {
      return {
        stage,
        status,
        durationMs: Date.now() - start,
        ...(detail ? { detail } : {}),
      };
    },
  };
}

// ── Main orchestrator ──────────────────────────────────────────────────

export async function analyzeContent(input: OrchestratorInput): Promise<OrchestratorResult> {
  const pipelineStart = Date.now();
  const stages: StageVerdict[] = [];
  const resolvedType = input.type ?? detectInputType(input.content);

  const heuristicSignals: string[] = [];
  let weightedSignals: UrlSignal[] = [];
  let threatIntel: ThreatIntel | undefined;
  let emailAnalysis: EmailAnalysisResult | undefined;
  const urlsToAnalyze: string[] = [];

  // ── STAGE: Email Forensics (type === "email") ──────────────────────
  if (resolvedType === "email") {
    const timer = timedStage("email_forensics");
    try {
      const emailResult = await analyzeEmail(input.content);
      emailAnalysis = emailResult.analysis;

      // Merge email signals into heuristic signals for the aggregator
      heuristicSignals.push(...emailResult.signals);
      weightedSignals.push(...emailResult.weightedSignals);

      // Extract URLs from email body for further analysis
      if (emailResult.extractedUrls.length > 0) {
        urlsToAnalyze.push(...emailResult.extractedUrls);
      }

      stages.push(timer.finish("flagged", `${emailResult.signals.length} signal(s) found`));
    } catch (error) {
      console.error("Email forensics failed:", error);
      stages.push(timer.finish("error", "Email analysis failed"));
    }
  }

  // ── STAGE: Screenshot / Image (Gemini multimodal OCR) ──────────────
  if (resolvedType === "screenshot") {
    if (!input.content.startsWith("data:image/")) {
      // Return a minimal error result
      return buildErrorResult(resolvedType, stages, pipelineStart, "Invalid image format");
    }

    const [header, base64Data] = input.content.split(",");
    const mimeType = header.replace("data:", "").replace(";base64", "");
    const timer = timedStage("gemini_image");

    try {
      const imageResult = await analyzeImageWithGemini(base64Data, mimeType);
      if (!imageResult) {
        stages.push(timer.finish("error", "Gemini image analysis returned null"));
        return buildErrorResult(resolvedType, stages, pipelineStart,
          "Image analysis could not be completed. Try checking the URL or message text directly.");
      }

      stages.push(timer.finish("pass", `Risk: ${imageResult.riskLevel}`));
      heuristicSignals.push(...imageResult.signals);

      // Extract URLs from the screenshot for URL pipeline
      if (imageResult.extractedUrls?.length) {
        for (const extractedUrl of imageResult.extractedUrls) {
          const trimmed = extractedUrl.trim();
          if (trimmed && (trimmed.startsWith("http") || trimmed.startsWith("www."))) {
            urlsToAnalyze.push(trimmed);
            break; // Only analyze the first extracted URL
          }
        }
      }

      // For screenshots, Gemini already ran. We'll still feed results into
      // the aggregator below (via the Gemini text path if URLs were found,
      // otherwise directly).
      if (urlsToAnalyze.length === 0) {
        // No URLs found — use the Gemini image result directly in aggregation
        const result = aggregateRisk({
          heuristicSignals,
          weightedSignals,
          threatIntel,
          geminiRiskLevel: imageResult.riskLevel,
          geminiSignals: imageResult.signals,
          geminiRecommendations: imageResult.recommendations,
          geminiSummary: imageResult.summary,
        });

        return {
          ...result,
          pipelineTrace: { inputType: resolvedType, stages, totalDurationMs: Date.now() - pipelineStart },
        };
      }
    } catch (error) {
      console.error("Gemini image analysis error:", error);
      stages.push(timer.finish("error", "Gemini image analysis failed"));
      return buildErrorResult(resolvedType, stages, pipelineStart,
        "Image analysis could not be completed. Try checking the URL or message text directly.");
    }
  }

  // ── STAGE: Local Rules (text messages / QR text) ───────────────────
  if (resolvedType === "message" || resolvedType === "qr") {
    const isQrUrl = resolvedType === "qr" && /^https?:\/\//i.test(input.content.trim());
    if (isQrUrl) {
      urlsToAnalyze.push(input.content);
      stages.push({ stage: "rules", status: "skipped", detail: "QR content is a URL" });
    } else {
      const timer = timedStage("rules");
      const msgResult = analyzeMessage(input.content);
      heuristicSignals.push(...msgResult.signals);
      if (msgResult.extractedUrls.length > 0) {
        urlsToAnalyze.push(...msgResult.extractedUrls);
      }
      stages.push(timer.finish(
        msgResult.signals.length > 0 ? "flagged" : "pass",
        `${msgResult.signals.length} signal(s)`
      ));
    }
  }

  // ── STAGE: Direct URL input ────────────────────────────────────────
  if (resolvedType === "url") {
    urlsToAnalyze.push(input.content);
  }

  // ── STAGE: URL Pipeline (heuristic + ML + URLhaus — concurrent) ────
  if (urlsToAnalyze.length > 0) {
    const targetUrl = urlsToAnalyze[0];

    // URL heuristic analysis (synchronous / fast)
    const heuristicTimer = timedStage("url_heuristic");
    const urlResult = analyzeUrl(targetUrl);
    heuristicSignals.push(...urlResult.signalMessages);
    weightedSignals = [...weightedSignals, ...urlResult.signals];
    stages.push(heuristicTimer.finish(
      urlResult.signals.length > 0 ? "flagged" : "pass",
      `${urlResult.signals.length} signal(s)`
    ));

    // Run ML classifier and URLhaus concurrently
    const mlTimer = timedStage("ml_classifier");
    const urlhausTimer = timedStage("urlhaus");

    const [mlSettled, urlhausSettled] = await Promise.allSettled([
      classifyUrl(targetUrl),
      !urlResult.isMalformed && urlResult.normalizedUrl
        ? checkUrlhaus(urlResult.normalizedUrl)
        : Promise.resolve(undefined),
    ]);

    // Process ML result
    if (mlSettled.status === "fulfilled" && mlSettled.value) {
      const ml = mlSettled.value;
      if (ml.available && ml.signal) {
        heuristicSignals.push(`[ML] ${ml.signal} (model v${ml.modelVersion ?? "unknown"})`);
        if (ml.signal === "HIGH_RISK_SIGNAL") {
          weightedSignals.push({
            message: `ML model indicates multiple URL characteristics associated with phishing (v${ml.modelVersion ?? "unknown"})`,
            weight: "MODERATE",
          });
        } else if (ml.signal === "SUSPICIOUS_SIGNAL") {
          weightedSignals.push({
            message: `ML model flags this URL as suspicious (v${ml.modelVersion ?? "unknown"})`,
            weight: "WEAK",
          });
        }
        stages.push(mlTimer.finish(
          ml.signal === "LOW_RISK_SIGNAL" ? "clean" : "flagged",
          ml.signal
        ));
      } else {
        stages.push(mlTimer.finish("unavailable", "Model not loaded"));
      }
    } else {
      stages.push(mlTimer.finish(
        mlSettled.status === "rejected" ? "error" : "unavailable",
        mlSettled.status === "rejected" ? "ML classification failed" : "Model not loaded"
      ));
    }

    // Process URLhaus result
    if (urlhausSettled.status === "fulfilled" && urlhausSettled.value) {
      threatIntel = urlhausSettled.value;
      stages.push(urlhausTimer.finish(
        threatIntel.match ? "flagged" : "clean",
        threatIntel.match ? "Known malware URL" : "No match"
      ));
    } else if (urlResult.isMalformed) {
      stages.push(urlhausTimer.finish("skipped", "URL is malformed"));
    } else {
      stages.push(urlhausTimer.finish(
        urlhausSettled.status === "rejected" ? "error" : "unavailable",
        "URLhaus lookup failed"
      ));
    }
  }

  // ── STAGE: Gemini AI Analysis (always called) ──────────────────────
  // For screenshots, Gemini already ran via the image path above.
  // For all other types, call the text analysis now.
  let geminiResult = null;
  if (resolvedType !== "screenshot") {
    const geminiTimer = timedStage("gemini");
    try {
      const contentType = (resolvedType === "url" || (resolvedType === "qr" && urlsToAnalyze.length > 0))
        ? "url" as const
        : "message" as const;

      geminiResult = await analyzeWithGemini(
        input.content,
        contentType,
        heuristicSignals,
        threatIntel?.match
      );

      if (geminiResult) {
        stages.push(geminiTimer.finish("pass", `Risk: ${geminiResult.riskLevel}`));
      } else {
        stages.push(geminiTimer.finish("error", "Gemini returned null"));
      }
    } catch (error) {
      console.error("Gemini analysis error:", error);
      stages.push(geminiTimer.finish("error", "Gemini call failed"));
    }
  }

  // ── FINAL STAGE: Risk Aggregation ──────────────────────────────────
  const pipelineTrace: PipelineTrace = {
    inputType: resolvedType,
    stages,
    totalDurationMs: Date.now() - pipelineStart,
  };

  if (!geminiResult && resolvedType !== "screenshot") {
    // Gemini failed — aggregate with heuristic-only data
    const result = aggregateRisk({
      heuristicSignals,
      weightedSignals,
      threatIntel,
      geminiSignals: [],
      geminiRecommendations: [
        "AI analysis was unavailable. Results are based on structural signals only.",
        "If this looks suspicious, do not interact with it.",
      ],
      geminiSummary: "Analyzed using structural heuristics and threat intelligence only. AI analysis was unavailable.",
      geminiRiskLevel: "SAFE",
    });

    return {
      ...result,
      pipelineTrace,
      ...(emailAnalysis ? { emailAnalysis } : {}),
    };
  }

  const result = aggregateRisk({
    heuristicSignals,
    weightedSignals,
    threatIntel,
    geminiRiskLevel: geminiResult?.riskLevel ?? "SAFE",
    geminiSignals: geminiResult?.signals ?? [],
    geminiRecommendations: geminiResult?.recommendations ?? [],
    geminiSummary: geminiResult?.summary ?? "Analysis complete.",
  });

  return {
    ...result,
    pipelineTrace,
    ...(emailAnalysis ? { emailAnalysis } : {}),
  };
}

// ── Error result builder ───────────────────────────────────────────────

function buildErrorResult(
  inputType: string,
  stages: StageVerdict[],
  pipelineStart: number,
  message: string
): OrchestratorResult {
  return {
    level: "SAFE",
    confidence: "LOW",
    summary: message,
    warningIndicators: [],
    recommendations: [
      "If you suspect this content is dangerous, try checking the URL or message text directly.",
    ],
    signals: [],
    pipelineTrace: {
      inputType,
      stages,
      totalDurationMs: Date.now() - pipelineStart,
    },
  };
}
