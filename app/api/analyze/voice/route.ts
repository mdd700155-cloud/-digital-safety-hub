import { NextRequest, NextResponse } from "next/server";
import { analyzeVoiceAudio } from "@/lib/voice/voiceAnalyzer";
import { MAX_AUDIO_SIZE_BYTES, voiceUploadSchema } from "@/lib/validation/voice";

export const runtime = "nodejs";
const MAX_MULTIPART_BODY_BYTES = 13 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BODY_BYTES) {
      return NextResponse.json({ error: "Audio upload is too large." }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const durationField = formData.get("durationSeconds");

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