"use client";

import { useState } from "react";
import { AudioWaveform, Loader2, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeepfakeAnalysisResult } from "@/types/voiceAnalysis";
import { AudioUploader } from "@/features/voice-analysis/AudioUploader";
import { VoiceRecorder } from "@/features/voice-analysis/VoiceRecorder";
import { AudioPreview, AudioPreviewData } from "@/features/voice-analysis/AudioPreview";
import { convertToWav, guessMimeType } from "@/features/voice-analysis/audioUtils";
import { extractDeepfakeFeatures, aggregateFeatureScores } from "@/lib/voice/deepfakeDetector";
import { DeepfakeResult } from "./DeepfakeResult";

export function DeepfakeDetector() {
  const [audio, setAudio] = useState<AudioPreviewData | null>(null);
  const [uploadBlob, setUploadBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [result, setResult] = useState<DeepfakeAnalysisResult | null>(null);
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
      // Step 1: Client-side feature extraction
      setAnalysisStep("Extracting audio features…");
      const featureScores = await extractDeepfakeFeatures(audio.blob);
      const aggregateScore = aggregateFeatureScores(featureScores);

      // Step 2: Server-side Gemini analysis
      setAnalysisStep("Running AI deepfake analysis…");
      const formData = new FormData();
      formData.append("file", uploadBlob, audio.name);
      formData.append("durationSeconds", String(audio.durationSeconds));
      formData.append("featureScores", JSON.stringify(featureScores));
      formData.append("aggregateScore", String(aggregateScore));

      const response = await fetch("/api/analyze/deepfake", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          err?.error || "Deepfake analysis failed. Please try again."
        );
      }

      const data: DeepfakeAnalysisResult = await response.json();
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong during analysis."
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const handleReset = () => {
    setAudio(null);
    setUploadBlob(null);
    setResult(null);
    setError(null);
    setAnalysisStep("");
  };

  if (result) {
    return <DeepfakeResult result={result} onReset={handleReset} />;
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
          <h3 className="text-lg font-semibold">Analyzing for deepfake characteristics…</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
            {analysisStep || "Preparing audio analysis…"}
          </p>
          <p className="text-xs text-muted-foreground mt-3 max-w-sm leading-relaxed">
            We extract spectral, pitch, and temporal features from the audio,
            then run AI analysis to detect synthetic voice patterns. This usually
            takes a few seconds.
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
            <AudioWaveform className="h-4 w-4 mr-2" />
            Detect Deepfake
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
        <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        Your audio is analyzed locally for spectral features, then sent to Google&apos;s
        Gemini API for AI-based deepfake assessment. Nothing is stored.
      </p>

      <div className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
        <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        Detection results are AI-assisted estimates — not definitive determinations.
        Sophisticated deepfakes may evade detection.
      </div>
    </div>
  );
}
