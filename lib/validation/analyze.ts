import { z } from "zod";

export const analyzeRequestSchema = z.object({
  type: z.enum(["message", "url", "screenshot", "qr"]),
  content: z.string().min(1).max(5000000, "Content is too large"), // 5MB limit roughly for base64 images
  language: z.string().optional(), // Output language for analysis results (e.g. "hi", "bn", "ta")
});

export type AnalyzeRequestDto = z.infer<typeof analyzeRequestSchema>;
