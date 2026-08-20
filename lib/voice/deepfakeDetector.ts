"use client";

/**
 * Client-side deepfake audio feature extraction using the Web Audio API.
 *
 * Extracts spectral, temporal, prosody, and noise features that help
 * distinguish natural human speech from synthetic/AI-generated audio.
 * Inspired by the MFCC + spectral contrast + chroma approach used in
 * scikit-learn-based deepfake detection models.
 */

import { DeepfakeFeatureScore } from "@/types/voiceAnalysis";

/* ── Helpers ──────────────────────────────────────────────────────────── */

function getAudioContext(): AudioContext {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return new Ctor();
}

function mean(arr: Float32Array | number[]): number {
  if (arr.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  return sum / arr.length;
}

function stddev(arr: Float32Array | number[], avg?: number): number {
  if (arr.length < 2) return 0;
  const m = avg ?? mean(arr);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += (arr[i] - m) ** 2;
  return Math.sqrt(sum / (arr.length - 1));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** In-place radix-2 Cooley-Tukey FFT. Returns magnitudes for the first N/2 bins. */
function computeFftMagnitudes(realIn: Float32Array): Float32Array {
  const N = realIn.length;
  const real = new Float32Array(realIn);
  const imag = new Float32Array(N);

  // Bit reversal
  let j = 0;
  for (let i = 0; i < N - 1; i++) {
    if (i < j) {
      const temp = real[i];
      real[i] = real[j];
      real[j] = temp;
    }
    let m = Math.floor(N / 2);
    while (m >= 1 && j >= m) {
      j -= m;
      m = Math.floor(m / 2);
    }
    j += m;
  }

  // Cooley-Tukey
  const log2N = Math.log2(N);
  for (let l = 1; l <= log2N; l++) {
    const m = 1 << l;
    const m2 = m / 2;
    const wmReal = Math.cos(-2 * Math.PI / m);
    const wmImag = Math.sin(-2 * Math.PI / m);
    
    for (let k = 0; k < N; k += m) {
      let wReal = 1;
      let wImag = 0;
      for (let step = 0; step < m2; step++) {
        const tReal = wReal * real[k + step + m2] - wImag * imag[k + step + m2];
        const tImag = wReal * imag[k + step + m2] + wImag * real[k + step + m2];
        
        real[k + step + m2] = real[k + step] - tReal;
        imag[k + step + m2] = imag[k + step] - tImag;
        
        real[k + step] += tReal;
        imag[k + step] += tImag;
        
        const nextWReal = wReal * wmReal - wImag * wmImag;
        const nextWImag = wReal * wmImag + wImag * wmReal;
        wReal = nextWReal;
        wImag = nextWImag;
      }
    }
  }

  const numBins = N / 2;
  const magnitudes = new Float32Array(numBins);
  for (let i = 0; i < numBins; i++) {
    magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) + 1e-10;
  }
  return magnitudes;
}

/* ── Feature 1: Spectral Flatness ─────────────────────────────────────
 * Measures how "noise-like" vs "tonal" the spectrum is.
 * Synthetic voices often have either unnaturally flat or unnaturally
 * peaked spectral distributions. */

function analyzeSpectralFlatness(channelData: Float32Array, sampleRate: number): DeepfakeFeatureScore {
  const frameSize = 2048;
  const hopSize = 512;
  const flatnessValues: number[] = [];

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    const frame = channelData.slice(start, start + frameSize);

    // Apply Hann window
    const windowed = new Float32Array(frameSize);
    for (let i = 0; i < frameSize; i++) {
      windowed[i] = frame[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frameSize - 1)));
    }

    // Use fast FFT instead of naive O(N^2) DFT
    const magnitudes = computeFftMagnitudes(windowed);
    const numBins = frameSize / 2;

    // Spectral flatness = geometric mean / arithmetic mean
    const logSum = magnitudes.reduce((s, v) => s + Math.log(v), 0);
    const geoMean = Math.exp(logSum / numBins);
    const ariMean = magnitudes.reduce((s, v) => s + v, 0) / numBins;
    flatnessValues.push(geoMean / ariMean);

    // Only analyze first few seconds (performance)
    if (flatnessValues.length > (sampleRate / hopSize) * 5) break;
  }

  const avgFlatness = mean(flatnessValues);
  const flatnessVariation = stddev(flatnessValues, avgFlatness);

  // Very low variation in spectral flatness = suspicious (too uniform)
  // Natural speech has more variation between voiced/unvoiced segments
  const variationScore = clamp((1 - flatnessVariation / 0.15) * 60, 0, 80);
  // Extreme flatness values are suspicious
  const extremeScore = avgFlatness > 0.5 || avgFlatness < 0.02 ? 30 : 0;
  const score = clamp(Math.round(variationScore + extremeScore), 0, 100);

  return {
    name: "Spectral Flatness",
    score,
    weight: 0.12,
    explanation: score > 50
      ? "The audio's spectral distribution is unusually uniform, which can indicate synthetic generation."
      : "The spectral distribution shows natural variation typical of human speech.",
    category: "spectral",
  };
}

/* ── Feature 2: Pitch Regularity ──────────────────────────────────────
 * Natural speech has micro-variations in pitch. AI voices often have
 * unnaturally smooth or perfectly regular pitch contours. */

function analyzePitchRegularity(channelData: Float32Array, sampleRate: number): DeepfakeFeatureScore {
  const frameSize = 2048;
  const hopSize = 1024;
  const pitchValues: number[] = [];

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    const frame = channelData.slice(start, start + frameSize);

    // Simple autocorrelation-based pitch detection
    const minLag = Math.floor(sampleRate / 500); // max F0 = 500 Hz
    const maxLag = Math.floor(sampleRate / 60);  // min F0 = 60 Hz
    let bestLag = minLag;
    let bestCorr = -1;

    for (let lag = minLag; lag <= Math.min(maxLag, frameSize - 1); lag++) {
      let corr = 0;
      let norm1 = 0;
      let norm2 = 0;
      for (let i = 0; i < frameSize - lag; i++) {
        corr += frame[i] * frame[i + lag];
        norm1 += frame[i] * frame[i];
        norm2 += frame[i + lag] * frame[i + lag];
      }
      const normFactor = Math.sqrt(norm1 * norm2);
      if (normFactor > 0) corr /= normFactor;
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    // Only accept confident pitch estimates
    if (bestCorr > 0.3) {
      pitchValues.push(sampleRate / bestLag);
    }

    // Limit analysis to ~5 seconds
    if (pitchValues.length > 200) break;
  }

  if (pitchValues.length < 10) {
    return {
      name: "Pitch Regularity",
      score: 30,
      weight: 0.18,
      explanation: "Insufficient voiced speech detected for reliable pitch analysis.",
      category: "prosody",
    };
  }

  // Calculate pitch variation
  const pitchMean = mean(pitchValues);
  const pitchStd = stddev(pitchValues, pitchMean);
  const coeffOfVariation = pitchStd / pitchMean;

  // Calculate pitch jitter (frame-to-frame variation)
  const jitters: number[] = [];
  for (let i = 1; i < pitchValues.length; i++) {
    jitters.push(Math.abs(pitchValues[i] - pitchValues[i - 1]) / pitchMean);
  }
  const avgJitter = mean(jitters);

  // Natural speech: CoV typically 0.1–0.25, jitter typically 0.02–0.05
  let score = 0;
  if (coeffOfVariation < 0.08) score += 60; // Unnaturally constant pitch (increased sensitivity)
  else if (coeffOfVariation < 0.12) score += 40;

  if (avgJitter < 0.015) score += 50; // Unnaturally smooth transitions
  else if (avgJitter < 0.025) score += 25;

  score = clamp(score, 0, 100);

  return {
    name: "Pitch Regularity",
    score,
    weight: 0.18,
    explanation: score > 50
      ? "Pitch is unnaturally stable with very little micro-variation, which is typical of synthetic speech."
      : score > 30
        ? "Pitch shows some regularity that may indicate processing or synthesis."
        : "Pitch variation appears natural, with the micro-fluctuations typical of human speech.",
    category: "prosody",
  };
}

/* ── Feature 3: Zero-Crossing Rate Regularity ─────────────────────────
 * The rate at which the signal changes sign. Synthetic voices tend to
 * have more regular ZCR patterns than natural speech. */

function analyzeZCR(channelData: Float32Array, sampleRate: number): DeepfakeFeatureScore {
  const frameSize = 1024;
  const hopSize = 512;
  const zcrValues: number[] = [];

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    let crossings = 0;
    for (let i = start + 1; i < start + frameSize; i++) {
      if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) crossings++;
    }
    zcrValues.push(crossings / frameSize);

    if (zcrValues.length > (sampleRate / hopSize) * 5) break;
  }

  const zcrMean = mean(zcrValues);
  const zcrStd = stddev(zcrValues, zcrMean);
  const zcrCoV = zcrMean > 0 ? zcrStd / zcrMean : 0;

  // Natural speech has high ZCR variation (voiced vs unvoiced segments)
  // Synthetic speech often has more uniform ZCR
  let score = 0;
  if (zcrCoV < 0.45) score += 60; // Too uniform
  else if (zcrCoV < 0.65) score += 35;

  // Also check if ZCR is unnaturally low overall (over-smoothed audio)
  if (zcrMean < 0.025) score += 30;

  score = clamp(score, 0, 100);

  return {
    name: "Zero-Crossing Rate",
    score,
    weight: 0.1,
    explanation: score > 40
      ? "The zero-crossing rate pattern is unusually uniform, suggesting processed or synthetic audio."
      : "Zero-crossing rate variation appears consistent with natural speech.",
    category: "temporal",
  };
}

/* ── Feature 4: Amplitude Envelope Smoothness ─────────────────────────
 * Natural speech has irregular amplitude dynamics. AI-generated speech
 * often has unnaturally smooth amplitude envelopes. */

function analyzeAmplitudeEnvelope(channelData: Float32Array, sampleRate: number): DeepfakeFeatureScore {
  const frameSize = 1024;
  const hopSize = 512;
  const rmsValues: number[] = [];

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    let sumSquared = 0;
    for (let i = start; i < start + frameSize; i++) {
      sumSquared += channelData[i] * channelData[i];
    }
    rmsValues.push(Math.sqrt(sumSquared / frameSize));

    if (rmsValues.length > (sampleRate / hopSize) * 5) break;
  }

  // Compute frame-to-frame differences (delta RMS)
  const deltas: number[] = [];
  for (let i = 1; i < rmsValues.length; i++) {
    deltas.push(Math.abs(rmsValues[i] - rmsValues[i - 1]));
  }

  const deltaStd = stddev(deltas);
  const rmsMean = mean(rmsValues);
  const rmsStd = stddev(rmsValues, rmsMean);
  const dynamicRange = rmsMean > 0 ? rmsStd / rmsMean : 0;

  let score = 0;

  // Too-smooth dynamics = suspicious
  if (deltaStd < 0.015) score += 50;
  else if (deltaStd < 0.025) score += 30;

  // Low dynamic range = suspicious
  if (dynamicRange < 0.35) score += 45;
  else if (dynamicRange < 0.5) score += 25;

  score = clamp(score, 0, 100);

  return {
    name: "Amplitude Dynamics",
    score,
    weight: 0.12,
    explanation: score > 40
      ? "The audio has an unusually smooth amplitude envelope, which can indicate synthetic generation."
      : "Amplitude dynamics show natural variation typical of human speech.",
    category: "temporal",
  };
}

/* ── Feature 5: Spectral Contrast ─────────────────────────────────────
 * Difference between spectral peaks and valleys across frequency bands.
 * Directly mirrors librosa.feature.spectral_contrast from the notebook. */

function analyzeSpectralContrast(channelData: Float32Array, sampleRate: number): DeepfakeFeatureScore {
  const frameSize = 2048;
  const hopSize = 1024;
  const numBands = 6;
  const contrastValues: number[][] = Array.from({ length: numBands }, () => []);

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    const frame = channelData.slice(start, start + frameSize);

    // Use fast FFT
    const magnitudes = computeFftMagnitudes(frame);
    const numBins = frameSize / 2;

    // Split into bands and compute contrast per band
    const binsPerBand = Math.floor(numBins / numBands);
    for (let b = 0; b < numBands; b++) {
      const bandStart = b * binsPerBand;
      const bandEnd = Math.min(bandStart + binsPerBand, numBins);
      const bandMags: number[] = [];
      for (let k = bandStart; k < bandEnd; k++) bandMags.push(magnitudes[k]);
      bandMags.sort((a, b) => a - b);

      const topN = Math.max(1, Math.floor(bandMags.length * 0.1));
      const peaks = mean(bandMags.slice(-topN));
      const valleys = mean(bandMags.slice(0, topN));
      contrastValues[b].push(peaks - valleys);
    }

    if (contrastValues[0].length > 30) break;
  }

  // Analyze contrast variation across bands and time
  const bandVariations = contrastValues.map(band => stddev(band));
  const avgVariation = mean(bandVariations);

  // Low variation in spectral contrast across time = suspicious
  let score = 0;
  if (avgVariation < 0.5) score += 40;
  else if (avgVariation < 1.0) score += 20;

  // Check if contrast is unnaturally uniform across bands
  const bandMeans = contrastValues.map(band => mean(band));
  const crossBandVariation = stddev(bandMeans);
  if (crossBandVariation < 0.3) score += 25;

  score = clamp(score, 0, 100);

  return {
    name: "Spectral Contrast",
    score,
    weight: 0.15,
    explanation: score > 40
      ? "Spectral contrast is unusually uniform across frequency bands and time, which is atypical of natural speech."
      : "Spectral contrast patterns appear consistent with natural human voice characteristics.",
    category: "spectral",
  };
}

/* ── Feature 6: Harmonic-to-Noise Ratio ───────────────────────────────
 * Natural speech has a balance of harmonic and noise components.
 * Synthetic voices often have an unnaturally high HNR (too clean). */

function analyzeHNR(channelData: Float32Array, sampleRate: number): DeepfakeFeatureScore {
  const frameSize = 2048;
  const hopSize = 1024;
  const hnrValues: number[] = [];

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    const frame = channelData.slice(start, start + frameSize);

    // Autocorrelation-based HNR estimation
    let r0 = 0; // Energy at lag 0
    for (let i = 0; i < frameSize; i++) r0 += frame[i] * frame[i];
    if (r0 < 1e-10) continue;

    // Find the peak autocorrelation (excluding lag 0)
    const minLag = Math.floor(sampleRate / 500);
    const maxLag = Math.floor(sampleRate / 60);
    let rMax = 0;

    for (let lag = minLag; lag <= Math.min(maxLag, frameSize - 1); lag++) {
      let r = 0;
      for (let i = 0; i < frameSize - lag; i++) {
        r += frame[i] * frame[i + lag];
      }
      if (r > rMax) rMax = r;
    }

    // HNR in dB: 10 * log10(rMax / (r0 - rMax))
    const noise = r0 - rMax;
    if (noise > 0 && rMax > 0) {
      hnrValues.push(10 * Math.log10(rMax / noise));
    }

    if (hnrValues.length > 50) break;
  }

  if (hnrValues.length < 5) {
    return {
      name: "Harmonic-to-Noise Ratio",
      score: 25,
      weight: 0.15,
      explanation: "Insufficient audio data for reliable harmonic-to-noise analysis.",
      category: "noise",
    };
  }

  const avgHNR = mean(hnrValues);
  const hnrStd = stddev(hnrValues, avgHNR);

  // Very high HNR (> 25 dB) = suspiciously clean
  // Very consistent HNR = suspiciously uniform
  let score = 0;
  if (avgHNR > 22) score += 60; // Extremely clean — likely synthetic
  else if (avgHNR > 18) score += 35;

  if (hnrStd < 3.5) score += 45; // Too consistent
  else if (hnrStd < 5.5) score += 20;

  score = clamp(score, 0, 100);

  return {
    name: "Harmonic-to-Noise Ratio",
    score,
    weight: 0.15,
    explanation: score > 40
      ? "The audio is unusually clean with very little noise, which is a common characteristic of synthetic/AI-generated speech."
      : "The harmonic-to-noise ratio appears natural, with the expected amount of noise in human speech.",
    category: "noise",
  };
}

/* ── Feature 7: Temporal Micro-Variation ──────────────────────────────
 * Natural speech has subtle irregularities in timing. AI voices may
 * have unnaturally regular timing between phonemes. */

function analyzeTemporalMicroVariation(channelData: Float32Array, sampleRate: number): DeepfakeFeatureScore {
  const frameSize = 512;
  const hopSize = 256;
  const energyValues: number[] = [];

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    let energy = 0;
    for (let i = start; i < start + frameSize; i++) {
      energy += channelData[i] * channelData[i];
    }
    energyValues.push(energy / frameSize);

    if (energyValues.length > (sampleRate / hopSize) * 5) break;
  }

  // Compute second-order differences (acceleration of energy)
  const accel: number[] = [];
  for (let i = 2; i < energyValues.length; i++) {
    accel.push(energyValues[i] - 2 * energyValues[i - 1] + energyValues[i - 2]);
  }

  const accelStd = stddev(accel);

  // Low acceleration variation = unnaturally smooth temporal dynamics
  let score = 0;
  if (accelStd < 0.002) score += 60;
  else if (accelStd < 0.008) score += 40;
  else if (accelStd < 0.015) score += 20;

  score = clamp(score, 0, 100);

  return {
    name: "Temporal Micro-Variation",
    score,
    weight: 0.08,
    explanation: score > 35
      ? "Temporal dynamics are unusually smooth, lacking the micro-irregularities of natural speech."
      : "Temporal patterns show the natural micro-variations expected in human speech.",
    category: "temporal",
  };
}

/* ── Feature 8: Formant Consistency ───────────────────────────────────
 * Natural formants shift smoothly during speech. Synthetic voices may
 * have abrupt or unnaturally consistent formant patterns. */

function analyzeFormantConsistency(channelData: Float32Array, sampleRate: number): DeepfakeFeatureScore {
  const frameSize = 2048;
  const hopSize = 1024;
  const spectralCentroids: number[] = [];

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    const frame = channelData.slice(start, start + frameSize);

    // Use fast FFT
    const magnitudes = computeFftMagnitudes(frame);
    const numBins = frameSize / 2;
    let weightedSum = 0;
    let totalMag = 0;

    for (let k = 0; k < numBins; k++) {
      const mag = magnitudes[k];
      const freq = (k * sampleRate) / frameSize;
      weightedSum += freq * mag;
      totalMag += mag;
    }

    if (totalMag > 1e-10) {
      spectralCentroids.push(weightedSum / totalMag);
    }

    if (spectralCentroids.length > 50) break;
  }

  if (spectralCentroids.length < 10) {
    return {
      name: "Formant Consistency",
      score: 20,
      weight: 0.1,
      explanation: "Insufficient audio data for formant analysis.",
      category: "spectral",
    };
  }

  const centroidMean = mean(spectralCentroids);
  const centroidStd = stddev(spectralCentroids, centroidMean);
  const centroidCoV = centroidMean > 0 ? centroidStd / centroidMean : 0;

  // Very low variation = suspiciously consistent formants
  let score = 0;
  if (centroidCoV < 0.05) score += 45;
  else if (centroidCoV < 0.1) score += 25;
  else if (centroidCoV < 0.15) score += 10;

  score = clamp(score, 0, 100);

  return {
    name: "Formant Consistency",
    score,
    weight: 0.1,
    explanation: score > 35
      ? "Formant patterns are unusually consistent, lacking the natural drift of human speech."
      : "Formant patterns show natural variation consistent with human speech.",
    category: "spectral",
  };
}

/* ── Main Extraction Pipeline ─────────────────────────────────────── */

export async function extractDeepfakeFeatures(
  blob: Blob
): Promise<DeepfakeFeatureScore[]> {
  const audioContext = getAudioContext();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    const features: DeepfakeFeatureScore[] = [
      analyzeSpectralFlatness(channelData, sampleRate),
      analyzePitchRegularity(channelData, sampleRate),
      analyzeZCR(channelData, sampleRate),
      analyzeAmplitudeEnvelope(channelData, sampleRate),
      analyzeSpectralContrast(channelData, sampleRate),
      analyzeHNR(channelData, sampleRate),
      analyzeTemporalMicroVariation(channelData, sampleRate),
      analyzeFormantConsistency(channelData, sampleRate),
    ];

    return features;
  } finally {
    audioContext.close().catch(() => undefined);
  }
}

/**
 * Computes a weighted aggregate score from individual feature scores.
 * Returns a probability 0–100 where higher = more likely synthetic.
 */
export function aggregateFeatureScores(features: DeepfakeFeatureScore[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const f of features) {
    weightedSum += f.score * f.weight;
    totalWeight += f.weight;
  }

  return totalWeight > 0 ? clamp(Math.round(weightedSum / totalWeight), 0, 100) : 0;
}
