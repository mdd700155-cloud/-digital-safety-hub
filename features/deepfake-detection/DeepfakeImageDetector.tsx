"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, Image as ImageIcon, ScanFace } from "lucide-react";
import { extractDeepfakeImageFeatures, aggregateImageFeatureScores } from "@/lib/image/deepfakeImageDetector";
import { DeepfakeImageAnalysisResult, DeepfakeImageFeatureScore } from "@/types/deepfakeImageAnalysis";
import { DeepfakeImageResult } from "./DeepfakeImageResult";

export function DeepfakeImageDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DeepfakeImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setError("Image must be smaller than 10MB");
        return;
      }
      if (!selected.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  };

  const processImageClientSide = async (imgElement: HTMLImageElement): Promise<{
    scores: DeepfakeImageFeatureScore[];
    aggregate: number;
  }> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not available");
    
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not get 2d context");

    // We can downscale massive images slightly to keep the UI responsive,
    // but for modern devices, processing a 1080p image in JS is <100ms.
    // Let's cap at 1024x1024 for the forensic analysis to ensure no freezes.
    const MAX_SIZE = 1024;
    let width = imgElement.naturalWidth;
    let height = imgElement.naturalHeight;

    if (width > MAX_SIZE || height > MAX_SIZE) {
      const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imgElement, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const scores = await extractDeepfakeImageFeatures(imageData);
    const aggregate = aggregateImageFeatureScores(scores);

    return { scores, aggregate };
  };

  const analyzeImage = async () => {
    if (!file || !previewUrl) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Load image to an HTMLImageElement to draw on canvas
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 2. Client-side processing (CS-LBP, Laplacian, etc.)
      const { scores, aggregate } = await processImageClientSide(img);

      // 3. Prepare FormData to send to the server (Gemini + Aggregation)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientScores", JSON.stringify(scores));
      formData.append("clientAggregateScore", aggregate.toString());

      // 4. API Call
      const response = await fetch("/api/analyze/deepfake-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      <Card
        role="button"
        tabIndex={file ? -1 : 0}
        aria-label="Upload a face or image to scan"
        onClick={() => !file && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (!file && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className="border-2 border-dashed bg-background [--card-spacing:--spacing(10)] flex flex-col items-center justify-center text-center hover:bg-muted/50 hover:border-primary/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ScanFace className="h-6 w-6 text-primary" />
          </div>
          
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Upload Face / Image</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Upload a photo to check for AI generation, deepfakes, and synthetic manipulation.
            </p>
          </div>

          {!file && (
            <div className="pt-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
              />
              <Button type="button" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Select Image
              </Button>
            </div>
          )}

          {file && previewUrl && (
            <div className="w-full max-w-md mx-auto mt-4 p-4 bg-background rounded-xl border space-y-4">
              <div className="relative aspect-video bg-secondary/50 rounded-lg overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 truncate pr-4">
                  <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium">{file.name}</span>
                </div>
                <span className="text-muted-foreground shrink-0">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setResult(null);
                  }}
                  disabled={isAnalyzing}
                >
                  Clear
                </Button>
                <Button 
                  type="button"
                  className="flex-1"
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ScanFace className="mr-2 h-4 w-4" />
                      Scan Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="w-full max-w-md p-3.5 text-sm bg-destructive/10 text-destructive rounded-lg border border-destructive/20"
            >
              {error}
            </div>
          )}
        </div>
      </Card>

      {result && <DeepfakeImageResult result={result} />}
    </div>
  );
}
