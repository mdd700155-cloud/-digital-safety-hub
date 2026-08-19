import { NextRequest, NextResponse } from "next/server";
import { analyzeDeepfakeAudio } from "@/lib/voice/deepfakeAnalyzer";
import { voiceUploadSchema } from "@/lib/validation/voice";
import { DeepfakeFeatureScore } from "@/types/voiceAnalysis";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
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

    const parsed = voiceUploadSchema.safeParse({ durationSeconds: durationField });
    const durationSeconds = parsed.success ? parsed.data.durationSeconds : 0;

    // Parse client-side feature scores
    let clientFeatureScores: DeepfakeFeatureScore[] = [];
    let clientAggregateScore = 0;

    try {
      if (featureScoresField) {
        clientFeatureScores = JSON.parse(String(featureScoresField));
      }
      if (aggregateScoreField) {
        clientAggregateScore = Number(aggregateScoreField);
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
