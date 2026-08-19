"use client";

import { DeepfakeImageFeatureScore } from "@/types/deepfakeImageAnalysis";

/**
 * Client-side deepfake image feature extraction.
 * Processes an ImageData object using HTML5 Canvas to extract forensic features.
 */

// Clamp value between min and max
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Convert RGBA to Grayscale
function toGrayscale(imageData: ImageData): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    // Luminosity method: 0.299 R + 0.587 G + 0.114 B
    gray[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return gray;
}

/**
 * Feature 1: Center-Symmetric Local Binary Patterns (CS-LBP)
 * Directly adapted from the deepfake-detection notebook.
 * Evaluates micro-texture patterns. AI faces often have different texture entropy.
 */
function analyzeCSLBP(gray: Uint8ClampedArray, width: number, height: number): DeepfakeImageFeatureScore {
  const histogram = new Array(16).fill(0); // CS-LBP has 4 bits = 16 possible values
  let validPixels = 0;

  // Iterate over image, ignoring 1-pixel border
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const getPixel = (px: number, py: number) => gray[py * width + px];

      // Center-Symmetric pairs in 3x3 neighborhood
      const right = getPixel(x + 1, y);
      const left = getPixel(x - 1, y);
      const bottomRight = getPixel(x + 1, y + 1);
      const topLeft = getPixel(x - 1, y - 1);
      const bottom = getPixel(x, y + 1);
      const top = getPixel(x, y - 1);
      const bottomLeft = getPixel(x - 1, y + 1);
      const topRight = getPixel(x + 1, y - 1);

      let val = 0;
      if (right >= left) val += 1;
      if (bottomRight >= topLeft) val += 2;
      if (bottom >= top) val += 4;
      if (bottomLeft >= topRight) val += 8;

      histogram[val]++;
      validPixels++;
    }
  }

  // Calculate Shannon entropy of the CS-LBP histogram
  let entropy = 0;
  for (let i = 0; i < 16; i++) {
    if (histogram[i] > 0) {
      const p = histogram[i] / validPixels;
      entropy -= p * Math.log2(p);
    }
  }

  // Natural photos usually have high entropy (diverse textures).
  // AI generated faces often have unusually uniform textures (lower entropy).
  // Max possible entropy for 16 bins is 4.0.
  
  let score = 0;
  // If entropy is suspiciously low, it's heavily penalized.
  if (entropy < 3.2) score += 60;
  else if (entropy < 3.5) score += 35;
  else if (entropy < 3.7) score += 15;

  // Sometimes AI adds artificial uniform noise (too high entropy)
  if (entropy > 3.95) score += 20;

  score = clamp(score, 0, 100);

  return {
    name: "CS-LBP Texture Entropy",
    score,
    weight: 0.4,
    explanation: score > 40
      ? `Micro-texture patterns are unusually uniform (Entropy: ${entropy.toFixed(2)}), which is typical of AI-generated skin and surfaces.`
      : "Texture patterns show natural variation consistent with real photographs.",
    category: "texture",
  };
}

/**
 * Feature 2: High-Frequency Noise Variance (Laplacian Variance)
 * Measures image blur / smoothness. AI-generated faces (especially GANs) 
 * often lack natural sensor noise and high-frequency details.
 */
function analyzeNoiseVariance(gray: Uint8ClampedArray, width: number, height: number): DeepfakeImageFeatureScore {
  let meanLaplacian = 0;
  let laplacianVariance = 0;
  let count = 0;

  const laplacianValues: number[] = [];

  // Simple 3x3 Laplacian filter to detect edges and high-frequency noise
  // [ 0,  1,  0 ]
  // [ 1, -4,  1 ]
  // [ 0,  1,  0 ]
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = gray[y * width + x];
      const top = gray[(y - 1) * width + x];
      const bottom = gray[(y + 1) * width + x];
      const left = gray[y * width + (x - 1)];
      const right = gray[y * width + (x + 1)];

      const laplace = top + bottom + left + right - 4 * center;
      laplacianValues.push(laplace);
      meanLaplacian += laplace;
      count++;
    }
  }

  meanLaplacian /= count;

  for (let i = 0; i < count; i++) {
    laplacianVariance += Math.pow(laplacianValues[i] - meanLaplacian, 2);
  }
  laplacianVariance /= count;

  // Natural photos have a certain amount of sensor noise and sharp edges.
  // Extremely low variance indicates an unnaturally smooth, "plastic" image (common in AI).
  // Extremely high variance might indicate artificial sharpening or noise injection.
  let score = 0;
  if (laplacianVariance < 50) score += 60; // Extremely blurry/smooth
  else if (laplacianVariance < 150) score += 30; // Very smooth
  
  if (laplacianVariance > 3000) score += 40; // Over-sharpened/artificial noise

  score = clamp(score, 0, 100);

  return {
    name: "Noise & Sharpness Variance",
    score,
    weight: 0.3,
    explanation: score > 40
      ? `The image lacks natural sensor noise or exhibits artificial smoothing (Variance: ${Math.round(laplacianVariance)}), common in AI generation.`
      : "The image noise profile and sharpness appear consistent with a real camera sensor.",
    category: "noise",
  };
}

/**
 * Feature 3: Color Channel Correlation
 * Real camera sensors use Bayer filters, causing slight correlations between RGB channels.
 * AI models often generate RGB channels independently, disrupting natural correlation.
 */
function analyzeColorCorrelation(imageData: ImageData): DeepfakeImageFeatureScore {
  const { data } = imageData;
  const numPixels = data.length / 4;
  
  let sumR = 0, sumG = 0, sumB = 0;
  for (let i = 0; i < data.length; i += 4) {
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
  }
  
  const meanR = sumR / numPixels;
  const meanG = sumG / numPixels;
  const meanB = sumB / numPixels;

  let covRG = 0, varR = 0, varG = 0;
  
  // Calculate Pearson correlation between R and G channels
  for (let i = 0; i < data.length; i += 4) {
    const diffR = data[i] - meanR;
    const diffG = data[i + 1] - meanG;
    covRG += diffR * diffG;
    varR += diffR * diffR;
    varG += diffG * diffG;
  }

  const correlationRG = covRG / Math.sqrt(varR * varG);

  let score = 0;
  // Natural images typically have strong positive correlation between channels
  if (correlationRG < 0.5) score += 50; // Unusually decorrelated
  else if (correlationRG < 0.7) score += 25;
  else if (correlationRG > 0.995) score += 30; // Unnaturally perfectly correlated (grayscale disguised as RGB)

  score = clamp(score, 0, 100);

  return {
    name: "Color Channel Correlation",
    score,
    weight: 0.3,
    explanation: score > 30
      ? "The correlation between color channels is anomalous, suggesting artificial generation rather than a camera sensor."
      : "Color channel relationships are consistent with physical camera sensors.",
    category: "compression",
  };
}

/* ── Main Extraction Pipeline ─────────────────────────────────────── */

export async function extractDeepfakeImageFeatures(
  imageData: ImageData
): Promise<DeepfakeImageFeatureScore[]> {
  const gray = toGrayscale(imageData);
  const width = imageData.width;
  const height = imageData.height;

  // We limit analysis to a center crop or max size if the image is huge, 
  // but for modern machines, doing a full pass on a ~1MP image is fast enough.
  // We'll process the whole thing.

  const features: DeepfakeImageFeatureScore[] = [
    analyzeCSLBP(gray, width, height),
    analyzeNoiseVariance(gray, width, height),
    analyzeColorCorrelation(imageData),
  ];

  return features;
}

/**
 * Computes a weighted aggregate score from individual feature scores.
 * Returns a probability 0–100 where higher = more likely synthetic.
 */
export function aggregateImageFeatureScores(features: DeepfakeImageFeatureScore[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const f of features) {
    weightedSum += f.score * f.weight;
    totalWeight += f.weight;
  }

  return totalWeight > 0 ? clamp(Math.round(weightedSum / totalWeight), 0, 100) : 0;
}
