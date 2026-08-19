import { z } from "zod";

export const deepfakeGeminiSchema = z.object({
  probability: z.number().min(0).max(100),
  riskLevel: z.enum(["LIKELY_AUTHENTIC", "UNCERTAIN", "LIKELY_SYNTHETIC"]),
  reasoning: z.string(),
  observations: z.array(z.string()),
  naturalness: z.object({
    prosody: z.number().min(0).max(100).describe("How natural is the speech rhythm and intonation (0 = robotic, 100 = natural)"),
    breathing: z.number().min(0).max(100).describe("Presence of natural breathing patterns (0 = none, 100 = natural)"),
    consistency: z.number().min(0).max(100).describe("Speaker identity consistency throughout (0 = inconsistent, 100 = consistent)"),
    backgroundNoise: z.number().min(0).max(100).describe("Natural background noise vs too-clean audio (0 = suspiciously clean, 100 = natural)"),
    transitions: z.number().min(0).max(100).describe("Quality of word-to-word transitions (0 = unnatural, 100 = natural)"),
  }),
});

export type DeepfakeGeminiDto = z.infer<typeof deepfakeGeminiSchema>;
