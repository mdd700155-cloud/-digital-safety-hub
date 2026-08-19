"use client";

import { useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { VoiceAnalysisResult, DeepfakeAnalysisResult } from "@/types/voiceAnalysis";
import { AudioUploader } from "@/features/voice-analysis/AudioUploader";
import { VoiceRecorder } from "@/features/voice-analysis/VoiceRecorder";
import { AudioPreview, AudioPreviewData } from "@/features/voice-analysis/AudioPreview";
import { convertToWav, guessMimeType } from "@/features/voice-analysis/audioUtils";
import { extractDeepfakeFeatures, aggregateFeatureScores } from "@/lib/voice/deepfakeDetector";
import { UnifiedAudioResult } from "./UnifiedAudioResult";
import { Button } from "@/components/ui/button";

export function UnifiedAudioAnalyzer() {
  const [audio, setAudio] = useState<AudioPreviewData | null>(null);
  const [uploadBlob, setUploadBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [voiceResult, setVoiceResult] = useState<VoiceAnalysisResult | null>(null);
  const [deepfakeResult, setDeepfakeResult] = useState<DeepfakeAnalysisResult | null>(null);
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
    setAnalysisStep("Extracting audio forensics...");

    try {
      // 1. Client-Side Feature Extraction for Deepfake Detection
      setAnalysisStep("Extracting audio forensics...");
      const clientFeatures = await extractDeepfakeFeatures(uploadBlob);
      const clientAggregateScore = aggregateFeatureScores(clientFeatures);

      // 2. Prepare Form Data
      setAnalysisStep("Running AI analysis models...");
      const formDataDeepfake = new FormData();
      formDataDeepfake.append("file", uploadBlob, audio.name);
      formDataDeepfake.append("clientScores", JSON.stringify(clientFeatures));
      formDataDeepfake.append("clientAggregateScore", clientAggregateScore.toString());

      const formDataVoice = new FormData();
      formDataVoice.append("file", uploadBlob, audio.name);
      formDataVoice.append("durationSeconds", String(audio.durationSeconds));

      // 3. Execute both API requests concurrently
      const [deepfakeResponse, voiceResponse] = await Promise.all([
        fetch("/api/analyze/deepfake", {
          method: "POST",
          body: formDataDeepfake,
        }),
        fetch("/api/analyze/voice", {
          method: "POST",
          body: formDataVoice,
        })
      ]);

      if (!deepfakeResponse.ok || !voiceResponse.ok) {
        throw new Error("One or more analysis engines failed to respond.");
      }

      const deepfakeData: DeepfakeAnalysisResult = await deepfakeResponse.json();
      const voiceData: VoiceAnalysisResult = await voiceResponse.json();

      setDeepfakeResult(deepfakeData);
      setVoiceResult(voiceData);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong during analysis.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  const handleReset = () => {
    setAudio(null);
    setUploadBlob(null);
    setVoiceResult(null);
    setDeepfakeResult(null);
    setError(null);
    setAnalysisStep("");
  };

  if (voiceResult && deepfakeResult && audio) {
    return (
      <UnifiedAudioResult 
        voiceResult={voiceResult} 
        deepfakeResult={deepfakeResult} 
        audio={audio} 
        onReset={handleReset} 
      />
    );
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
          <h3 className="text-lg font-semibold">Analyzing audio comprehensively…</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
            {analysisStep || "Preparing audio analysis…"}
          </p>
          <p className="text-xs text-muted-foreground mt-3 max-w-sm leading-relaxed">
            We are checking for AI voice cloning signatures and transcribing the content to detect scam intents. This usually takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <VoiceRecorder onRecorded={handleRecorded} onError={setError} />
        <AudioUploader onFileSelected={handleFileSelected} onError={setError} />
      </div>

      {audio && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <AudioPreview 
            audio={audio} 
            isRecording={false} 
            onReRecord={handleReset} 
            onDelete={handleReset} 
          />
          
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            <Mic className="mr-2 h-5 w-5" />
            Analyze Audio
          </Button>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
