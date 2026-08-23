import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeDeepfakeImage } from "@/lib/image/deepfakeImageAnalyzer";
import { DeepfakeImageFeatureScore } from "@/types/deepfakeImageAnalysis";

export const maxDuration = 60; // 60 seconds maximum execution time
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_BODY_BYTES = 11 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const featureScoreSchema = z.object({
  name: z.string().max(100),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  explanation: z.string().max(500),
  category: z.enum(["texture", "noise", "compression"]),
});
const featureScoresSchema = z.array(featureScoreSchema).max(32);

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BODY_BYTES) {
      return NextResponse.json({ error: "Image upload is too large." }, { status: 413 });
    }

    const formData = await req.formData();
    
    const file = formData.get("file");
    const clientScoresJson = formData.get("clientScores") as string | null;
    const clientAggregateScoreStr = formData.get("clientAggregateScore") as string | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Please upload an image." }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image file is empty or exceeds the 10 MB limit." }, { status: 400 });
    }

    let clientFeatureScores: DeepfakeImageFeatureScore[] = [];
    let clientAggregateScore = 0;

    if (clientScoresJson && clientAggregateScoreStr) {
      try {
        const parsedScores = featureScoresSchema.safeParse(JSON.parse(clientScoresJson));
        const parsedAggregate = z.coerce.number().min(0).max(100).safeParse(clientAggregateScoreStr);
        if (parsedScores.success) clientFeatureScores = parsedScores.data;
        if (parsedAggregate.success) clientAggregateScore = parsedAggregate.data;
      } catch (e) {
        console.warn("Failed to parse client scores for image analysis.");
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await analyzeDeepfakeImage(
      buffer,
      file.type,
      file.size,
      clientFeatureScores,
      clientAggregateScore
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Deepfake image analysis error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during deepfake image analysis." },
      { status: 500 }
    );
  }
}
