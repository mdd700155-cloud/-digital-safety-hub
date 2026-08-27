import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/validation/analyze";
import { analyzeContent } from "@/lib/orchestrator/orchestrator";

export async function POST(request: Request) {
  try {
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
