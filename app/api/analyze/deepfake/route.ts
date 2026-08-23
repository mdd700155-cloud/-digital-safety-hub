import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeDeepfakeAudio } from "@/lib/voice/deepfakeAnalyzer";
import { MAX_AUDIO_SIZE_BYTES, voiceUploadSchema } from "@/lib/validation/voice";
import { DeepfakeFeatureScore } from "@/types/voiceAnalysis";

export const runtime = "nodejs";
const MAX_MULTIPART_BODY_BYTES = 13 * 1024 * 1024;
const featureScoreSchema = z.object({
  name: z.string().max(100),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  explanation: z.string().max(500),
  category: z.enum(["spectral", "temporal", "prosody", "noise"]),
});
const featureScoresSchema = z.array(featureScoreSchema).max(32);

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BODY_BYTES) {
      return NextResponse.json({ error: "Audio upload is too large." }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const durationField = formData.get("durationSeconds");
    const featureScoresField = formData.get("featureScores");
    const aggregateScoreField = formData.get("aggregateScore");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please attach an audio file (field name: file)." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json(
        { error: "The audio file is empty or exceeds the 12 MB limit." },
        { status: 400 }
      );
    }

    const parsed = voiceUploadSchema.safeParse({ durationSeconds: durationField });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid audio duration." }, { status: 400 });
    }
    const durationSeconds = parsed.data.durationSeconds;

    // Parse client-side feature scores
    let clientFeatureScores: DeepfakeFeatureScore[] = [];
    let clientAggregateScore = 0;

    try {
      if (featureScoresField) {
        const parsedScores = featureScoresSchema.safeParse(JSON.parse(String(featureScoresField)));
        if (parsedScores.success) clientFeatureScores = parsedScores.data;
      }
      if (aggregateScoreField) {
        const parsedAggregate = z.coerce.number().min(0).max(100).safeParse(aggregateScoreField);
        if (parsedAggregate.success) clientAggregateScore = parsedAggregate.data;
      }
    } catch {
      // If parsing fails, proceed with empty client scores
      console.warn("Failed to parse client-side deepfake feature scores.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await analyzeDeepfakeAudio(
      {
        buffer,
        declaredMimeType: file.type,
        sizeBytes: file.size,
        durationSeconds,
      },
      clientFeatureScores,
      clientAggregateScore
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Deepfake analysis failed:", error);
    return NextResponse.json(
      { error: "Something went wrong while analyzing the audio. Please try again." },
      { status: 500 }
    );
  }
}
