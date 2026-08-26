import { z } from "zod";

export const analyzeRequestSchema = z.object({
  type: z.enum(["message", "url", "screenshot", "qr", "email"]).optional(),
  content: z.string().min(1).max(10000000, "Content is too large"), // 10MB limit for base64 images and .eml files
});

export type AnalyzeRequestDto = z.infer<typeof analyzeRequestSchema>;

