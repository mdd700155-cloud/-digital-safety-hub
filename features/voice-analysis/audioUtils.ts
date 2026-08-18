"use client";

/**
 * Client-side audio helpers: WAV conversion (for browser-recorded WebM),
 * duration/file-size formatting, and MIME guessing.
 */

export const MAX_AUDIO_SIZE_BYTES = 12 * 1024 * 1024;
export const MAX_AUDIO_DURATION_SECONDS = 180;

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function guessMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    wav: "audio/wav",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    ogg: "audio/ogg",
    opus: "audio/ogg",
    webm: "audio/webm",
  };
  return map[ext] ?? "audio/wav";
}

function encodeWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = 16000;
  const samples = audioBuffer.getChannelData(0);

  // Downsample to 16 kHz mono by simple decimation with linear interpolation.
  const ratio = audioBuffer.sampleRate / sampleRate;
  const targetLength = Math.floor(samples.length / ratio);
  const pcm = new Int16Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const srcIndex = Math.min(Math.floor(i * ratio), samples.length - 1);
    const sample = Math.max(-1, Math.min(1, samples[srcIndex]));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  new Int16Array(buffer, 44).set(pcm);

  return new Blob([buffer], { type: "audio/wav" });
}

function getAudioContext(): AudioContext {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return new Ctor();
}

/**
 * Converts any decodable audio blob to a 16 kHz mono WAV.
 * Returns null when the browser cannot decode the file (e.g. OGG on Safari).
 */
export async function convertToWav(
  blob: Blob,
  mimeType: string
): Promise<Blob | null> {
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") {
    return blob;
  }

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = getAudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wav = encodeWav(audioBuffer);
    audioContext.close().catch(() => undefined);
    return wav;
  } catch {
    return null;
  }
}

/** Measures duration by decoding the audio through the browser. */
export async function measureAudioDuration(blob: Blob): Promise<number> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = getAudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;
    audioContext.close().catch(() => undefined);
    return duration;
  } catch {
    return 0;
  }
}