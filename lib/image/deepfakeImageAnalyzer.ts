import { GoogleGenAI, Type, Schema } from "@google/genai";
import {
  DeepfakeImageAnalysisResult,
  DeepfakeImageFeatureScore,
  DeepfakeImageGeminiAssessment,
  DeepfakeImageRiskLevel,
  ImageMetadata,
} from "@/types/deepfakeImageAnalysis";
import { deepfakeImageGeminiSchema, DeepfakeImageGeminiDto } from "@/lib/validation/deepfakeImage";

const geminiResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    probability: {
      type: Type.NUMBER,
      description: "Overall probability (0-100) that this image is synthetic/AI-generated or deepfake. 0 = definitely real, 100 = definitely synthetic.",
    },
    riskLevel: {
      type: Type.STRING,
      description: "Must be exactly one of: LIKELY_AUTHENTIC, UNCERTAIN, LIKELY_SYNTHETIC. Use UNCERTAIN when evidence is mixed.",
    },
    reasoning: {
      type: Type.STRING,
      description: "A 2-3 sentence plain-language explanation of why this image is classified as authentic, uncertain, or synthetic. Be specific about what you observed.",
    },
    observations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific observations about the image's naturalness. Each observation should be a single factual statement.",
    },
    naturalness: {
      type: Type.OBJECT,
      properties: {
        lighting: {
          type: Type.NUMBER,
          description: "Consistency of lighting and shadows (0 = inconsistent, 100 = natural)",
        },
        texture: {
          type: Type.NUMBER,
          description: "Skin texture, pores, and micro-details (0 = too smooth/plastic, 100 = natural)",
        },
        eyes: {
          type: Type.NUMBER,
          description: "Pupil symmetry and corneal reflections (0 = asymmetrical/mismatched, 100 = natural)",
        },
        background: {
          type: Type.NUMBER,
          description: "Background blending and structural integrity (0 = warped/hallucinated, 100 = natural)",
        },
        edges: {
          type: Type.NUMBER,
          description: "Blending of hair, glasses, or accessories (0 = sharp/blurry artifacts, 100 = natural)",
        },
      },
      required: ["lighting", "texture", "eyes", "background", "edges"],
    },
  },
  required: ["probability", "riskLevel", "reasoning", "observations", "naturalness"],
};

const DEEPFAKE_IMAGE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const RETRY_DELAYS_MS = [1000, 2000, 3000];

const DISCLAIMER =
  "This analysis uses AI-assisted heuristics and image signal processing (CS-LBP, Laplacian variance) to estimate the likelihood of synthetic image generation. " +
  "It is not a definitive determination. Sophisticated deepfakes may evade detection, and highly edited real photos may trigger false positives. " +
  "Use this as one factor in your assessment, not as the sole basis for any decision.";

const DEEPFAKE_IMAGE_PROMPT = `You are a digital image forensics expert specializing in detecting AI-generated faces and deepfakes.
Analyze this image to determine whether it is a real photograph or an AI-generated/manipulated image.

Evaluate the following characteristics carefully:

1. LIGHTING & SHADOWS
   - Real photos have consistent light sources and geometrically accurate shadows.
   - AI generated images often have conflicting light sources, missing shadows, or flat lighting.

2. SKIN TEXTURE & MICRO-DETAILS
   - Real skin has pores, blemishes, and varied textures.
   - AI faces often have unnaturally smooth, "plastic" skin, or overly sharp details that don't match the depth of field.

3. EYES & REFLECTIONS
   - Real eyes have circular pupils and matching corneal reflections (catchlights) that reflect the actual environment.
   - AI eyes often have asymmetrical pupils, mismatched reflections, or strange bleeding of colors in the iris.

4. EDGES & BLENDING
   - Check where hair meets the background, skin, or clothing.
   - AI often struggles with hair rendering, creating blurry blobs, disconnected strands, or merging hair with earrings/clothing.
   - Look at glasses frames for asymmetry or merging with the face.

5. BACKGROUND & STRUCTURAL INTEGRITY
   - Real backgrounds make physical sense.
   - AI backgrounds often contain hallucinated objects, warped text, or impossible geometry (like non-Euclidean lines or melting structures).
   - Check hands and teeth (if visible) for impossible anatomy.

CRITICAL RULES:
1. Be conservative. UNCERTAIN is appropriate when evidence is mixed.
2. Low-resolution or heavily compressed photos are inherently harder to assess.
3. Studio portraits with heavy makeup/retouching can look like AI — do not assume obvious artifacts are AI if they could be Photoshop airbrushing.
4. AI models (Midjourney, DALL-E, Stable Diffusion) are getting very good. Look for subtle inconsistencies in symmetry.`;

type GeminiFailure = "invalid_key" | "service_down";

async function analyzeWithGemini(
  base64Image: string,
  mimeType: string
): Promise<DeepfakeImageGeminiDto | GeminiFailure> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set — deepfake image analysis will use client-side features only.");
    return "invalid_key";
  }

  const ai = new GoogleGenAI({ apiKey });

  for (const model of DEEPFAKE_IMAGE_MODELS) {
    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                { text: DEEPFAKE_IMAGE_PROMPT },
                { inlineData: { data: base64Image, mimeType } },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: geminiResponseSchema,
            temperature: 0.1,
          },
        });

        if (!response.text) return "service_down";

        const parsed = JSON.parse(response.text);
        const validated = deepfakeImageGeminiSchema.safeParse(parsed);

        if (!validated.success) {
          console.warn("Deepfake image response failed validation:", validated.error.issues);
          return "service_down";
        }

        return validated.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        const isInvalidKey =
          message.includes("API_KEY_INVALID") ||
          message.includes("API key not valid") ||
          message.includes("API key expired") ||
          message.includes("UNAUTHENTICATED") ||
          message.includes("PERMISSION_DENIED");

        if (isInvalidKey) {
          console.error("Gemini deepfake analysis failed (invalid API key).");
          return "invalid_key";
        }

        const isRetryable =
          message.includes("UNAVAILABLE") ||
          message.includes("high demand") ||
          message.includes("429") ||
          message.includes("RESOURCE_EXHAUSTED") ||
          message.includes("rate limit");

        const isLastModel = model === DEEPFAKE_IMAGE_MODELS[DEEPFAKE_IMAGE_MODELS.length - 1];
        const isLastAttempt = isLastModel && attempt === RETRY_DELAYS_MS.length - 1;

        if (!isRetryable) {
          if (isLastModel) {
            console.error("Gemini deepfake analysis failed after all models exhausted:", error);
          } else {
            console.warn(
              `Gemini deepfake model ${model} non-retryable error (${message.slice(0, 60)}) — trying next model`
            );
            break;
          }
        } else if (isLastAttempt) {
          console.error("Gemini deepfake analysis failed after all retries:", error);
        } else {
          console.warn(
            `Gemini deepfake unavailable (${message.slice(0, 60)}) — retrying (model ${model}, attempt ${attempt + 1})`
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt] ?? 3000));
        }
      }
    }
  }

  return "service_down";
}

function aggregateImageResult(
  geminiResult: DeepfakeImageGeminiDto | null,
  clientFeatureScore: number,
  featureScores: DeepfakeImageFeatureScore[]
): { probability: number; riskLevel: DeepfakeImageRiskLevel; summary: string; recommendations: string[] } {
  if (geminiResult) {
    // Suspicion-weighted average: 75% weight to whichever analysis is MORE suspicious.
    const maxScore = Math.max(geminiResult.probability, clientFeatureScore);
    const minScore = Math.min(geminiResult.probability, clientFeatureScore);
    const combined = Math.round(maxScore * 0.75 + minScore * 0.25);

    let riskLevel: DeepfakeImageRiskLevel;
    if (combined >= 60) {
      riskLevel = "LIKELY_SYNTHETIC";
    } else if (combined >= 30) {
      riskLevel = "UNCERTAIN";
    } else {
      riskLevel = "LIKELY_AUTHENTIC";
    }

    return {
      probability: combined,
      riskLevel,
      summary: buildSummary(riskLevel, combined, true),
      recommendations: buildRecommendations(riskLevel),
    };
  }

  // Client-side only (no Gemini)
  let riskLevel: DeepfakeImageRiskLevel;
  if (clientFeatureScore >= 45) { // Highly sensitive fallback
    riskLevel = "LIKELY_SYNTHETIC";
  } else if (clientFeatureScore >= 25) {
    riskLevel = "UNCERTAIN";
  } else {
    riskLevel = "LIKELY_AUTHENTIC";
  }

  return {
    probability: clientFeatureScore,
    riskLevel,
    summary: buildSummary(riskLevel, clientFeatureScore, false),
    recommendations: buildRecommendations(riskLevel),
  };
}

function buildSummary(riskLevel: DeepfakeImageRiskLevel, probability: number, aiUsed: boolean): string {
  const method = aiUsed ? "AI analysis and image signal processing" : "image signal processing";

  switch (riskLevel) {
    case "LIKELY_SYNTHETIC":
      return `Our ${method} detected multiple characteristics consistent with AI-generated or manipulated images (${probability}% synthetic probability). This face/image may not be real.`;
    case "UNCERTAIN":
      return `Our ${method} produced mixed results (${probability}% synthetic probability). We cannot confidently determine whether this image is a real photo or AI-generated. Exercise caution.`;
    case "LIKELY_AUTHENTIC":
      return `Our ${method} found characteristics consistent with a real photograph (${probability}% synthetic probability). However, highly sophisticated deepfakes may still evade detection.`;
  }
}

function buildRecommendations(riskLevel: DeepfakeImageRiskLevel): string[] {
  switch (riskLevel) {
    case "LIKELY_SYNTHETIC":
      return [
        "Treat this image with high suspicion — it may be AI-generated or a deepfake.",
        "Check for mismatched earrings, asymmetrical pupils, or garbled background text manually.",
        "Do not trust the identity of the person in this image without secondary verification.",
      ];
    case "UNCERTAIN":
      return [
        "We could not conclusively determine whether this image is real or synthetic.",
        "Look closely at the hair, skin texture, and background for subtle anomalies.",
        "Consider the source and context of the image.",
      ];
    case "LIKELY_AUTHENTIC":
      return [
        "This image appears to be a real photograph, but no detection method is perfect.",
        "If you suspect this is a scam, remember that scammers often steal real photos from social media.",
      ];
  }
}

export async function analyzeDeepfakeImage(
  buffer: Buffer,
  mimeType: string,
  sizeBytes: number,
  clientFeatureScores: DeepfakeImageFeatureScore[],
  clientAggregateScore: number
): Promise<DeepfakeImageAnalysisResult | { error: string; status: number }> {
  
  if (sizeBytes > 10 * 1024 * 1024) {
    return { error: "Image file is too large. Maximum size is 10MB.", status: 400 };
  }

  const geminiRaw = await analyzeWithGemini(buffer.toString("base64"), mimeType);

  let geminiAssessment: DeepfakeImageGeminiAssessment | undefined;
  let geminiDto: DeepfakeImageGeminiDto | null = null;
  let aiUsed = false;

  if (typeof geminiRaw !== "string") {
    geminiDto = geminiRaw;
    aiUsed = true;
    geminiAssessment = {
      probability: geminiRaw.probability,
      riskLevel: geminiRaw.riskLevel as DeepfakeImageRiskLevel,
      reasoning: geminiRaw.reasoning,
      observations: geminiRaw.observations.slice(0, 8),
    };
  }

  const aggregated = aggregateImageResult(geminiDto, clientAggregateScore, clientFeatureScores);

  const metadata: ImageMetadata = {
    fileType: mimeType,
    fileSizeBytes: sizeBytes,
    processingStatus: aiUsed ? "COMPLETED" : (typeof geminiRaw === "string" && geminiRaw === "invalid_key" ? "AI_UNAVAILABLE" : "COMPLETED"),
  };

  return {
    type: "deepfake-image",
    probability: aggregated.probability,
    riskLevel: aggregated.riskLevel,
    featureScores: clientFeatureScores,
    geminiAssessment,
    summary: aggregated.summary,
    recommendations: aggregated.recommendations,
    metadata,
    aiUsed,
    disclaimer: DISCLAIMER,
  };
}
