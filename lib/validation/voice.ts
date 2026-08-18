import { z } from "zod";

export const MAX_AUDIO_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB — safe margin under Gemini's 20 MB request cap
export const MAX_AUDIO_DURATION_SECONDS = 180; // 3 minutes

export const voiceTranscriptionSchema = z.object({
  transcript: z.string(),
  riskLevel: z.enum(["SAFE", "SUSPICIOUS", "HIGH_RISK"]),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

export type VoiceTranscriptionDto = z.infer<typeof voiceTranscriptionSchema>;

export const voiceUploadSchema = z.object({
  durationSeconds: z.coerce.number().min(0).max(3600).default(0),
});
