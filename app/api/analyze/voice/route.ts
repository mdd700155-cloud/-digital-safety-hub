import { NextRequest, NextResponse } from "next/server";
import { analyzeVoiceAudio } from "@/lib/voice/voiceAnalyzer";
import { voiceUploadSchema } from "@/lib/validation/voice";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const durationField = formData.get("durationSeconds");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please attach an audio file (field name: file)." },
        { status: 400 }
      );
    }

    const parsed = voiceUploadSchema.safeParse({ durationSeconds: durationField });
    const durationSeconds = parsed.success ? parsed.data.durationSeconds : 0;

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await analyzeVoiceAudio({
      buffer,
      declaredMimeType: file.type,
      sizeBytes: file.size,
      durationSeconds,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Voice analysis failed:", error);
    return NextResponse.json(
      { error: "Something went wrong while analyzing the audio. Please try again." },
      { status: 500 }
    );
  }
}