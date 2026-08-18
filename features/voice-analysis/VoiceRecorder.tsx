"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "./audioUtils";

interface VoiceRecorderProps {
  onRecorded: (blob: Blob, durationSeconds: number) => void;
  onError: (message: string) => void;
}

export function VoiceRecorder({ onRecorded, onError }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setIsStarting(false);
    setElapsed(0);
  };

  useEffect(() => cleanup, []);

  const startRecording = async () => {
    try {
      setIsStarting(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const duration = (Date.now() - startedAtRef.current) / 1000;
        cleanup();
        if (blob.size > 0) {
          onRecorded(blob, Math.max(1, Math.round(duration)));
        } else {
          onError("Recording produced no audio. Please try again.");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setIsRecording(true);
      setIsStarting(false);

      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startedAtRef.current) / 1000);
      }, 250);
    } catch {
      setIsStarting(false);
      onError(
        "Microphone access was denied or is unavailable. You can upload an audio file instead."
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 text-destructive font-medium">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
            </span>
            Recording… {formatDuration(elapsed)}
          </div>
          <p className="text-xs text-muted-foreground">
            Speak clearly. Recordings stop automatically at 3 minutes.
          </p>
          <Button type="button" variant="destructive" onClick={stopRecording}>
            <Square className="h-4 w-4 mr-2 fill-current" />
            Stop Recording
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            onClick={startRecording}
            disabled={isStarting}
            className="min-w-[180px]"
          >
            {isStarting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mic className="h-4 w-4 mr-2" />
            )}
            {isStarting ? "Starting…" : "Start Recording"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Microphone access is requested only when you click this button.
          </p>
        </>
      )}
    </div>
  );
}