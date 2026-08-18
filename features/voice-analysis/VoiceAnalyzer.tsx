"use client";

import { useState } from "react";
import { Mic, Loader2, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceAnalysisResult } from "@/types/voiceAnalysis";
import { VoiceRecorder } from "./VoiceRecorder";
import { AudioUploader } from "./AudioUploader";
import { AudioPreview, AudioPreviewData } from "./AudioPreview";
import { VoiceRiskResult } from "./VoiceRiskResult";
import { convertToWav, guessMimeType } from "./audioUtils";

export function VoiceAnalyzer() {
  const [audio, setAudio] = useState<AudioPreviewData | null>(null);
  const [uploadBlob, setUploadBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VoiceAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prepareAudio = async (
    blob: Blob,
    name: string,
    mimeType: string,
    durationSeconds: number
  ) => {
    const prepared = (await convertToWav(blob, mimeType)) ?? blob;
    setUploadBlob(prepared);
    setAudio({
      blob,
      name,
      mimeType,
      durationSeconds,
      sizeBytes: blob.size,
    });
    setError(null);
  };

  const handleRecorded = (blob: Blob, durationSeconds: number) => {
    const mimeType = blob.type || "audio/webm";
    void prepareAudio(blob, "voice-recording", mimeType, durationSeconds);
  };

  const handleFileSelected = (file: File, durationSeconds: number) => {
    void prepareAudio(file, file.name, guessMimeType(file), durationSeconds);
  };

  const handleAnalyze = async () => {
    if (!audio || !uploadBlob) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadBlob, audio.name);
      formData.append("durationSeconds", String(audio.durationSeconds));

      const response = await fetch("/api/analyze/voice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          err?.error || "Voice analysis failed. Please try again."
        );
      }

      const data: VoiceAnalysisResult = await response.json();
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong during analysis."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAudio(null);
    setUploadBlob(null);
    setResult(null);
    setError(null);
  };

  if (result && audio) {
    return <VoiceRiskResult result={result} audio={audio} onReset={handleReset} />;
  }

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center space-y-5 text-center p-8">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Transcribing and analyzing your audio…</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
            The audio is transcribed by Google Gemini, then checked for scam
            patterns. This usually takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!audio ? (
        <>
          <AudioUploader onFileSelected={handleFileSelected} onError={setError} />
          <VoiceRecorder onRecorded={handleRecorded} onError={setError} />
        </>
      ) : (
        <AudioPreview
          audio={audio}
          isRecording={false}
          onReRecord={handleReset}
          onDelete={handleReset}
        />
      )}

      {error && (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive p-3.5 rounded-lg text-sm border border-destructive/20"
        >
          {error}
        </div>
      )}

      {audio && (
        <div className="flex justify-end items-center gap-3 pt-2 border-t border-border/60">
          <Button type="button" variant="ghost" onClick={handleReset}>
            Clear
          </Button>
          <Button type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
            <Mic className="h-4 w-4 mr-2" />
            Analyze Voice
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
        <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        Your audio is sent to Google&apos;s Gemini API for transcription only.
        Nothing is stored on our servers, and the recording stays on your device.
      </p>

      <div className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
        <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        We never claim a call is definitely a scam — the result is an honest,
        evidence-based assessment you can use to protect yourself.
      </div>
    </div>
  );
}