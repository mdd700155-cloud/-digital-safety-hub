import { NextRequest, NextResponse } from "next/server";
import { analyzeDeepfakeImage } from "@/lib/image/deepfakeImageAnalyzer";
import { DeepfakeImageFeatureScore } from "@/types/deepfakeImageAnalysis";

export const maxDuration = 60; // 60 seconds maximum execution time

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const file = formData.get("file") as File | null;
    const clientScoresJson = formData.get("clientScores") as string | null;
    const clientAggregateScoreStr = formData.get("clientAggregateScore") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Please upload an image." }, { status: 400 });
    }

    let clientFeatureScores: DeepfakeImageFeatureScore[] = [];
    let clientAggregateScore = 0;

    if (clientScoresJson && clientAggregateScoreStr) {
      try {
        clientFeatureScores = JSON.parse(clientScoresJson);
        clientAggregateScore = parseInt(clientAggregateScoreStr, 10);
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
