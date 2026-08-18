"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import {
  MAX_AUDIO_DURATION_SECONDS,
  MAX_AUDIO_SIZE_BYTES,
  formatDuration,
  formatFileSize,
  measureAudioDuration,
} from "./audioUtils";

interface AudioUploaderProps {
  onFileSelected: (file: File, durationSeconds: number) => void;
  onError: (message: string) => void;
}

export function AudioUploader({ onFileSelected, onError }: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isReading, setIsReading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("audio/") && file.type) {
      onError("Please choose an audio file (WAV, MP3, M4A, OGG, or WebM).");
      return;
    }
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      onError("The audio file is too large. Maximum size is 12 MB.");
      return;
    }

    setIsReading(true);
    try {
      const duration = await measureAudioDuration(file);
      if (duration > MAX_AUDIO_DURATION_SECONDS) {
        onError(
          `The audio is ${formatDuration(duration)} long. Maximum duration is ${formatDuration(MAX_AUDIO_DURATION_SECONDS)}.`
        );
        return;
      }
      onFileSelected(file, Math.round(duration));
    } catch {
      // If duration can't be measured, still accept the file — the server
      // validates the real format from its contents.
      const duration = 0;
      onFileSelected(file, duration);
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <input
        type="file"
        accept="audio/wav,audio/x-wav,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/opus,audio/webm"
        className="hidden"
        ref={inputRef}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an audio file"
        className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring ${
          isDragging
            ? "border-primary/60 bg-primary/5"
            : "hover:bg-muted/50 hover:border-primary/40"
        }`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 ring-1 ring-primary/10">
          <UploadCloud className="h-5 w-5" />
        </div>
        <h3 className="font-medium mb-1">
          {isReading ? "Reading audio…" : "Click to upload or drag & drop"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          WAV, MP3, M4A, OGG or WebM (max {formatFileSize(MAX_AUDIO_SIZE_BYTES)},
          up to {formatDuration(MAX_AUDIO_DURATION_SECONDS)})
        </p>
      </div>
      <div className="w-full border-t border-border/60 pt-3">
        <p className="text-xs text-muted-foreground text-center">
          or record the suspicious call below
        </p>
      </div>
    </div>
  );
}