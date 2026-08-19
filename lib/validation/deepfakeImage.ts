import { z } from "zod";

export const deepfakeImageGeminiSchema = z.object({
  probability: z.number().min(0).max(100),
  riskLevel: z.enum(["LIKELY_AUTHENTIC", "UNCERTAIN", "LIKELY_SYNTHETIC"]),
  reasoning: z.string(),
  observations: z.array(z.string()),
  naturalness: z.object({
    lighting: z.number().min(0).max(100).describe("Consistency of lighting and shadows (0 = inconsistent, 100 = natural)"),
    texture: z.number().min(0).max(100).describe("Skin texture, pores, and micro-details (0 = too smooth/plastic, 100 = natural)"),
    eyes: z.number().min(0).max(100).describe("Pupil symmetry and corneal reflections (0 = asymmetrical/mismatched, 100 = natural)"),
    background: z.number().min(0).max(100).describe("Background blending and structural integrity (0 = warped/hallucinated, 100 = natural)"),
    edges: z.number().min(0).max(100).describe("Blending of hair, glasses, or accessories (0 = sharp/blurry artifacts, 100 = natural)"),
  }),
});

export type DeepfakeImageGeminiDto = z.infer<typeof deepfakeImageGeminiSchema>;
