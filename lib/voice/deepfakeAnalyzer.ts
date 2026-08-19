/**
 * Deepfake Voice Analyzer — server-side orchestration.
 *
 * Pipeline: file validation (reuses voice validation) → Gemini deepfake
 * analysis → aggregation with client-side feature scores.
 */

import { GoogleGenAI, Type, Schema } from "@google/genai";
import {
  DeepfakeAnalysisResult,
  DeepfakeFeatureScore,
  DeepfakeGeminiAssessment,
  DeepfakeRiskLevel,
  VoiceMetadata,
} from "@/types/voiceAnalysis";
import { validateVoiceFile, VoiceFileInput } from "./voiceAnalyzer";
import { deepfakeGeminiSchema, DeepfakeGeminiDto } from "@/lib/validation/deepfake";

/* ── Gemini Schema ────────────────────────────────────────────────── */

const geminiDeepfakeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    probability: {
      type: Type.NUMBER,
      description:
        "Overall probability (0-100) that this audio is synthetic/AI-generated. 0 = definitely human. 100 = definitely synthetic.",
    },
    riskLevel: {
      type: Type.STRING,
      description:
        "Must be exactly one of: LIKELY_AUTHENTIC, UNCERTAIN, LIKELY_SYNTHETIC. Use UNCERTAIN when evidence is mixed.",
    },
    reasoning: {
      type: Type.STRING,
      description:
        "A 2-3 sentence plain-language explanation of why this audio is classified as authentic, uncertain, or synthetic. Be specific about what you observed.",
    },
    observations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Specific observations about the audio's naturalness. Each observation should be a single factual statement.",
    },
    naturalness: {
      type: Type.OBJECT,
      properties: {
        prosody: {
          type: Type.NUMBER,
          description: "How natural is the speech rhythm and intonation (0 = robotic, 100 = natural).",
        },
        breathing: {
          type: Type.NUMBER,
          description: "Presence of natural breathing patterns (0 = none/absent, 100 = natural).",
        },
        consistency: {
          type: Type.NUMBER,
          description: "Speaker identity consistency throughout (0 = inconsistent, 100 = consistent).",
        },
        backgroundNoise: {
          type: Type.NUMBER,
          description: "Natural background noise vs suspiciously clean audio (0 = too clean, 100 = natural).",
        },
        transitions: {
          type: Type.NUMBER,
          description: "Quality of word-to-word transitions (0 = unnatural/abrupt, 100 = natural).",
        },
      },
      required: ["prosody", "breathing", "consistency", "backgroundNoise", "transitions"],
    },
  },
  required: ["probability", "riskLevel", "reasoning", "observations", "naturalness"],
};

/* ── Constants ────────────────────────────────────────────────────── */

const DEEPFAKE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const RETRY_DELAYS_MS = [1000, 2000, 3000];

const DISCLAIMER =
  "This analysis uses AI-assisted heuristics and audio signal processing to estimate the likelihood of synthetic voice generation. " +
  "It is not a definitive determination. Sophisticated deepfakes may evade detection, and some authentic recordings may trigger false positives. " +
  "Use this as one factor in your assessment, not as the sole basis for any decision.";

/* ── Gemini Prompt ────────────────────────────────────────────────── */

const DEEPFAKE_PROMPT = `You are an audio forensics expert specializing in synthetic voice detection. Analyze this audio recording to determine whether it is natural human speech or AI-generated/synthetic speech.

Evaluate the following characteristics carefully:

1. PROSODY & INTONATION
   - Natural speech has varied rhythm, stress patterns, and intonation curves
   - Synthetic speech often has unnaturally smooth or monotonous prosody
   - Check for natural emphasis on important words

2. BREATHING & BIOLOGICAL MARKERS
   - Natural speech contains breathing sounds, lip smacks, throat clearing, swallowing
   - Synthetic speech often lacks these biological markers entirely
   - Filler words ("um", "uh", "hmm") with natural placement suggest authentic speech

3. SPEAKER CONSISTENCY
   - Natural speakers maintain consistent voice quality, accent, and timbre
   - Some synthesis methods produce subtle inconsistencies in speaker identity
   - Check for abrupt changes in voice quality mid-sentence

4. BACKGROUND NOISE
   - Natural recordings typically have ambient noise (room reverb, hum, movement)
   - Suspiciously clean audio with zero background noise is a red flag
   - But studio recordings can also be clean, so weigh this carefully

5. WORD TRANSITIONS & COARTICULATION
   - Natural speech has smooth coarticulation (sounds blend between words)
   - Some synthetic systems produce slightly unnatural pauses or transitions
   - Listen for metallic or "glassy" quality in transitions

6. AUDIO ARTIFACTS
   - Check for vocoder artifacts, spectral discontinuities, or phasing effects
   - Some TTS systems produce subtle buzzing or ringing in certain frequency ranges
   - Extremely uniform spectral characteristics across the entire clip

CRITICAL RULES:
1. Be conservative. UNCERTAIN is appropriate when evidence is mixed.
2. Short audio clips (< 3 seconds) are inherently harder to assess — adjust confidence accordingly.
3. High-quality TTS (like recent neural TTS models) can be very convincing — do not assume obvious artifacts.
4. Studio-quality recordings are not automatically synthetic — professionals use good equipment.
5. Telephone-quality audio may sound unnatural due to compression, not synthesis.
6. Non-English speech should still be assessed on the same acoustic features.`;

/* ── Gemini Call ───────────────────────────────────────────────────── */

type GeminiFailure = "invalid_key" | "service_down";

async function analyzeWithGemini(
  base64Audio: string,
  mimeType: string
): Promise<DeepfakeGeminiDto | GeminiFailure> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set — deepfake analysis will use client-side features only.");
    return "invalid_key";
  }

  const ai = new GoogleGenAI({ apiKey });

  for (const model of DEEPFAKE_MODELS) {
    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                { text: DEEPFAKE_PROMPT },
                { inlineData: { data: base64Audio, mimeType } },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: geminiDeepfakeSchema,
            temperature: 0.1,
          },
        });

        if (!response.text) return "service_down";

        const parsed = JSON.parse(response.text);
        const validated = deepfakeGeminiSchema.safeParse(parsed);

        if (!validated.success) {
          console.warn("Deepfake response failed validation:", validated.error.issues);
          return "service_down";
        }

        return validated.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        const isInvalidKey =
          message.includes("API_KEY_INVALID") ||
          message.includes("API key not valid") ||
          message.includes("API key expired") ||
          message.includes("INVALID_ARGUMENT");

        if (isInvalidKey) {
          console.error("Gemini deepfake analysis failed (invalid API key).");
          return "invalid_key";
        }

        const isRetryable =
          message.includes("UNAVAILABLE") ||
          message.includes("high demand") ||
          message.includes("429") ||
          message.includes("RESOURCE_EXHAUSTED") ||
          message.includes("rate limit");

        if (!isRetryable) {
          console.error("Gemini deepfake analysis failed:", error);
          return "service_down";
        }

        const isLastModel = model === DEEPFAKE_MODELS[DEEPFAKE_MODELS.length - 1];
        const isLastAttempt = isLastModel && attempt === RETRY_DELAYS_MS.length - 1;

        if (isLastAttempt) {
          console.error("Gemini deepfake analysis failed after all retries:", error);
        } else {
          console.warn(
            `Gemini deepfake unavailable (${message.slice(0, 60)}) — retrying (model ${model}, attempt ${attempt + 1})`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt] ?? 3000));
      }
    }
  }

  return "service_down";
}

/* ── Aggregation ──────────────────────────────────────────────────── */

function aggregateDeepfakeResult(
  geminiResult: DeepfakeGeminiDto | null,
  clientFeatureScore: number,
  featureScores: DeepfakeFeatureScore[]
): { probability: number; riskLevel: DeepfakeRiskLevel; summary: string; recommendations: string[] } {
  if (geminiResult) {
    // Weighted: 65% Gemini, 35% client-side features
    const combined = Math.round(geminiResult.probability * 0.65 + clientFeatureScore * 0.35);

    // Determine risk level based on combined score
    let riskLevel: DeepfakeRiskLevel;
    if (combined >= 65) {
      riskLevel = "LIKELY_SYNTHETIC";
    } else if (combined >= 35) {
      riskLevel = "UNCERTAIN";
    } else {
      riskLevel = "LIKELY_AUTHENTIC";
    }

    // If Gemini and client-side disagree significantly, lean toward UNCERTAIN
    const disagreement = Math.abs(geminiResult.probability - clientFeatureScore);
    if (disagreement > 40 && riskLevel !== "UNCERTAIN") {
      riskLevel = "UNCERTAIN";
    }

    return {
      probability: combined,
      riskLevel,
      summary: buildSummary(riskLevel, combined, true),
      recommendations: buildRecommendations(riskLevel),
    };
  }

  // Client-side only (no Gemini)
  let riskLevel: DeepfakeRiskLevel;
  if (clientFeatureScore >= 60) {
    riskLevel = "LIKELY_SYNTHETIC";
  } else if (clientFeatureScore >= 35) {
    riskLevel = "UNCERTAIN";
  } else {
    riskLevel = "LIKELY_AUTHENTIC";
  }

  return {
    probability: clientFeatureScore,
    riskLevel,
    summary: buildSummary(riskLevel, clientFeatureScore, false),
    recommendations: buildRecommendations(riskLevel),
  };
}

function buildSummary(riskLevel: DeepfakeRiskLevel, probability: number, aiUsed: boolean): string {
  const method = aiUsed ? "AI analysis and audio signal processing" : "audio signal processing";

  switch (riskLevel) {
    case "LIKELY_SYNTHETIC":
      return `Our ${method} detected multiple characteristics consistent with AI-generated or synthetic speech (${probability}% synthetic probability). This audio may not be from a real human speaker.`;
    case "UNCERTAIN":
      return `Our ${method} produced mixed results (${probability}% synthetic probability). We cannot confidently determine whether this audio is natural or synthetic. Exercise caution.`;
    case "LIKELY_AUTHENTIC":
      return `Our ${method} found characteristics consistent with natural human speech (${probability}% synthetic probability). However, sophisticated deepfakes may still evade detection.`;
  }
}

function buildRecommendations(riskLevel: DeepfakeRiskLevel): string[] {
  switch (riskLevel) {
    case "LIKELY_SYNTHETIC":
      return [
        "Treat this audio with high suspicion — it may be AI-generated.",
        "Do not make important decisions based solely on what is said in this audio.",
        "If this claims to be someone you know, verify their identity through a separate channel (e.g., call them directly).",
        "If used in a financial or legal context, seek professional verification.",
        "Report suspicious deepfake use to relevant authorities.",
      ];
    case "UNCERTAIN":
      return [
        "We could not conclusively determine whether this audio is real or synthetic.",
        "If this audio is from someone claiming to be a specific person, verify their identity directly.",
        "Do not take urgent actions based on this audio alone.",
        "Consider the context — who sent this audio and why?",
      ];
    case "LIKELY_AUTHENTIC":
      return [
        "This audio appears to be natural human speech, but no detection method is perfect.",
        "Advanced deepfakes can be very convincing — context matters.",
        "If you have other reasons for suspicion, trust your instinct and verify.",
      ];
  }
}

/* ── Main Entry Point ─────────────────────────────────────────────── */

export async function analyzeDeepfakeAudio(
  file: VoiceFileInput,
  clientFeatureScores: DeepfakeFeatureScore[],
  clientAggregateScore: number
): Promise<DeepfakeAnalysisResult | { error: string; status: number }> {
  const validation = validateVoiceFile(file);
  if (!validation.ok) {
    return { error: validation.error, status: 400 };
  }

  const { mimeType } = validation;

  // Run Gemini analysis
  const geminiRaw = await analyzeWithGemini(
    file.buffer.toString("base64"),
    mimeType
  );

  let geminiAssessment: DeepfakeGeminiAssessment | undefined;
  let geminiDto: DeepfakeGeminiDto | null = null;
  let aiUsed = false;

  if (typeof geminiRaw !== "string") {
    geminiDto = geminiRaw;
    aiUsed = true;
    geminiAssessment = {
      probability: geminiRaw.probability,
      riskLevel: geminiRaw.riskLevel as DeepfakeRiskLevel,
      reasoning: geminiRaw.reasoning,
      observations: geminiRaw.observations.slice(0, 8),
    };
  }

  // Aggregate results
  const aggregated = aggregateDeepfakeResult(
    geminiDto,
    clientAggregateScore,
    clientFeatureScores
  );

  const metadata: VoiceMetadata = {
    durationSeconds: file.durationSeconds,
    fileType: mimeType,
    fileSizeBytes: file.sizeBytes,
    processingStatus: aiUsed ? "COMPLETED" : (typeof geminiRaw === "string" && geminiRaw === "invalid_key" ? "AI_UNAVAILABLE" : "COMPLETED"),
  };

  return {
    type: "deepfake",
    probability: aggregated.probability,
    riskLevel: aggregated.riskLevel,
    featureScores: clientFeatureScores,
    geminiAssessment,
    summary: aggregated.summary,
    recommendations: aggregated.recommendations,
    metadata,
    aiUsed,
    disclaimer: DISCLAIMER,
  };
}
