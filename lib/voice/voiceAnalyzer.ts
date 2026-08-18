/**
 * Voice Scam Analyzer — server-side orchestration.
 *
 * Pipeline: file validation (magic bytes) → Gemini transcription →
 * deterministic signal detection → shared risk aggregation.
 */

import { RiskLevel } from "@/types/analysis";
import { VoiceAnalysisResult, VoiceMetadata } from "@/types/voiceAnalysis";
import { transcribeAudioWithGemini } from "./transcription";
import { detectVoiceSignals, inferScamCategory } from "./voiceSignals";
import { aggregateRisk } from "@/lib/security/aggregator";
import { MAX_AUDIO_SIZE_BYTES } from "@/lib/validation/voice";

const ALLOWED_MIME_TYPES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/ogg",
  "audio/opus",
  "audio/webm",
]);

export interface VoiceFileInput {
  buffer: Buffer;
  declaredMimeType: string;
  sizeBytes: number;
  durationSeconds: number;
}

/**
 * Sniffs the real audio format from the file's magic bytes.
 * Never trusts file extensions alone.
 */
export function detectAudioMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WAVE"
  ) {
    return "audio/wav";
  }

  if (buffer.subarray(0, 3).toString("ascii") === "ID3") {
    return "audio/mpeg";
  }

  // MP3 without ID3 tag: frame sync bytes 0xFF 0xFB / 0xFF 0xF3 / 0xFF 0xF2 / 0xFF 0xE3
  if (
    buffer[0] === 0xff &&
    (buffer[1] & 0xe0) === 0xe0 &&
    (buffer[1] & 0x06) !== 0
  ) {
    return "audio/mpeg";
  }

  // MP4/M4A container: bytes 4-8 are "ftyp"
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    return "audio/mp4";
  }

  // WebM/Matroska: EBML header 0x1A45DFA3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "audio/webm";
  }

  // Ogg container
  if (buffer.subarray(0, 4).toString("ascii") === "OggS") {
    return "audio/ogg";
  }

  return null;
}

export function validateVoiceFile(
  file: VoiceFileInput
): { ok: true; mimeType: string } | { ok: false; error: string } {
  if (file.sizeBytes === 0) {
    return { ok: false, error: "The audio file is empty." };
  }

  if (file.sizeBytes > MAX_AUDIO_SIZE_BYTES) {
    return {
      ok: false,
      error: "The audio file is too large. Maximum size is 12 MB.",
    };
  }

  const mimeType = detectAudioMime(file.buffer);
  if (!mimeType) {
    return {
      ok: false,
      error:
        "Unsupported audio format. Please upload a WAV, MP3, M4A, OGG, or WebM file.",
    };
  }

  // If the declared MIME type claims an audio format but the magic bytes
  // disagree, trust the magic bytes. If they agree, use the declared type
  // (it may be more specific, e.g. audio/x-m4a).
  if (
    file.declaredMimeType &&
    ALLOWED_MIME_TYPES.has(file.declaredMimeType) &&
    file.declaredMimeType.startsWith("audio/") &&
    file.declaredMimeType !== "audio/mpeg"
  ) {
    return { ok: true, mimeType: file.declaredMimeType };
  }

  return { ok: true, mimeType };
}

const PROTECTION_STEPS = [
  "End the call and stop interacting with the caller.",
  "Do not share OTPs, PINs, passwords, card details, or personal information.",
  "Do not transfer money, scan payment QR codes, or pay any 'fees' or 'fines'.",
  "Do not install remote-access or screen-sharing applications.",
  "Save the recording and any related messages as evidence.",
  "Contact your bank or service provider using their official contact details.",
  "If money was lost, call 1930 or report the incident at cybercrime.gov.in.",
];

function buildMetadata(
  durationSeconds: number,
  mimeType: string,
  sizeBytes: number,
  processingStatus: VoiceMetadata["processingStatus"]
): VoiceMetadata {
  return {
    durationSeconds,
    fileType: mimeType,
    fileSizeBytes: sizeBytes,
    processingStatus,
  };
}

function mapSignalToWeight(confidence: number): "STRONG" | "MODERATE" | "WEAK" {
  if (confidence >= 70) return "STRONG";
  if (confidence >= 40) return "MODERATE";
  return "WEAK";
}

export async function analyzeVoiceAudio(
  file: VoiceFileInput
): Promise<VoiceAnalysisResult | { error: string; status: number }> {
  const validation = validateVoiceFile(file);
  if (!validation.ok) {
    return { error: validation.error, status: 400 };
  }

  const { mimeType } = validation;

  const transcription = await transcribeAudioWithGemini(
    file.buffer.toString("base64"),
    mimeType
  );

  if (typeof transcription === "string") {
    if (transcription === "invalid_key") {
      return {
        error:
          "Voice analysis needs a valid Gemini API key. Add GEMINI_API_KEY to your .env.local file and restart the server. Get a free key at aistudio.google.com/apikey.",
        status: 503,
      };
    }
    return {
      error:
        "The speech-to-text service is temporarily unavailable. Please try again in a few minutes.",
      status: 503,
    };
  }

  const signals = detectVoiceSignals(transcription.transcript);
  const { scamType, uncertain } = inferScamCategory(signals);

  const weightedSignals = signals.map((s) => ({
    message: `[Voice] ${s.label}`,
    weight: mapSignalToWeight(s.confidence),
  }));

  const heuristicSignals = signals.map((s) => `[Voice] ${s.label}`);

  const aggregated = aggregateRisk({
    heuristicSignals,
    weightedSignals,
    geminiRiskLevel: transcription.riskLevel as RiskLevel,
    geminiSignals: [],
    geminiRecommendations: transcription.recommendations,
    geminiSummary: transcription.summary,
  });

  const protectionSteps =
    aggregated.level === "HIGH_RISK" ? PROTECTION_STEPS : [];

  return {
    type: "voice",
    level: aggregated.level,
    confidence: aggregated.confidence,
    scamType,
    scamTypeUncertain: uncertain,
    transcript: transcription.transcript,
    signals,
    summary: aggregated.summary,
    recommendations: aggregated.recommendations,
    warningIndicators: aggregated.warningIndicators,
    metadata: buildMetadata(
      file.durationSeconds,
      mimeType,
      file.sizeBytes,
      "COMPLETED"
    ),
    aiUsed: true,
    protectionSteps,
  };
}