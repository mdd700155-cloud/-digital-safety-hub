import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/validation/analyze";
import { analyzeContent } from "@/lib/orchestrator/orchestrator";

const MAX_REQUEST_BODY_BYTES = 6 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    const body = await request.json();

    // Validate request
    const validationResult = analyzeRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { type, content, language } = validationResult.data;

    // Call the unified orchestrator (handles email, url, message, screenshot, qr + language)
    const result = await analyzeContent({ content, type, language });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
