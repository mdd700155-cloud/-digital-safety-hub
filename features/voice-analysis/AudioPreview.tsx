"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileAudio, Play, Pause, Redo2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, formatFileSize } from "./audioUtils";

export interface AudioPreviewData {
  blob: Blob;
  name: string;
  mimeType: string;
  durationSeconds: number;
  sizeBytes: number;
}

interface AudioPreviewProps {
  audio: AudioPreviewData;
  isRecording: boolean;
  onReRecord: () => void;
  onDelete: () => void;
}

export function AudioPreview({
  audio,
  isRecording,
  onReRecord,
  onDelete,
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const srcUrl = useMemo(() => URL.createObjectURL(audio.blob), [audio.blob]);

  useEffect(() => {
    return () => URL.revokeObjectURL(srcUrl);
  }, [srcUrl]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  };

  return (
    <div className="border border-border rounded-xl bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/10">
            <FileAudio className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{audio.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDuration(audio.durationSeconds)} ·{" "}
              {formatFileSize(audio.sizeBytes)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </Button>
          {!isRecording && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReRecord}
              aria-label="Re-record audio"
            >
              <Redo2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Re-record</span>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            aria-label="Delete audio"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={srcUrl}
        className="w-full h-9"
        controls
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}