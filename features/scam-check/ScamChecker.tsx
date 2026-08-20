"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Link as LinkIcon, Image as ImageIcon, QrCode, AudioWaveform, ScanFace, Loader2, UploadCloud, X, ShieldCheck } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import { ResultDisplay } from "./ResultDisplay";
import { QrScanner } from "./QrScanner";
import { UnifiedAudioAnalyzer } from "../voice-analysis/UnifiedAudioAnalyzer";
import { DeepfakeImageDetector } from "@/features/deepfake-detection/DeepfakeImageDetector";

const STORAGE_KEY = "scam_checker_persisted_state_v1";

interface PersistedScamCheckerState {
  activeTab: string;
  inputValue: string;
  qrScanned: string | null;
}

function loadPersistedState(): PersistedScamCheckerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedScamCheckerState;
    if (typeof parsed === "object" && parsed !== null) {
      return {
        activeTab: typeof parsed.activeTab === "string" ? parsed.activeTab : "message",
        inputValue: typeof parsed.inputValue === "string" ? parsed.inputValue : "",
        qrScanned: typeof parsed.qrScanned === "string" ? parsed.qrScanned : null,
      };
    }
    return null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

interface ScamCheckerProps {
  compact?: boolean;
}

export function ScamChecker({ compact = false }: ScamCheckerProps) {
  const persisted = loadPersistedState();
  const [activeTab, setActiveTab] = useState<string>(persisted?.activeTab ?? "message");
  const [inputValue, setInputValue] = useState<string>(persisted?.inputValue ?? "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrScanned, setQrScanned] = useState<string | null>(persisted?.qrScanned ?? null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const toSave: PersistedScamCheckerState = { activeTab, inputValue, qrScanned };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore quota errors
    }
  }, [activeTab, inputValue, qrScanned]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInputValue(event.target.result as string);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const submitAnalysis = useCallback(async (type: string, content: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      const analysis: AnalysisResult = await response.json();
      setResult(analysis);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    await submitAnalysis(activeTab, inputValue);
  };

  // Called by QrScanner when a code is decoded
  const handleQrDecoded = useCallback(async (text: string) => {
    setQrScanned(text);
    setInputValue(text);
    // Determine if the QR content is a URL or plain text
    const type = /^https?:\/\//i.test(text.trim()) ? "url" : "message";
    await submitAnalysis(type, text);
  }, [submitAnalysis]);

  const handleReset = () => {
    setResult(null);
    setInputValue("");
    setError(null);
    setQrScanned(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  if (result) {
    return <ResultDisplay result={result} onReset={handleReset} />;
  }

  if (isAnalyzing) {
    return (
      <Card className="border shadow-soft min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center space-y-5 text-center p-6">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Analyzing your submission...</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
              Checking against known threat patterns, structural heuristics, and context. This usually takes a few seconds.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border shadow-soft">
      {!compact && (
        <CardHeader className="border-b border-border/40 bg-muted/30">
          <CardTitle className="flex items-center text-xl">
            <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
            What would you like to check?
          </CardTitle>
          <CardDescription>
            Select the type of content you want to analyze for potential threats.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-4 sm:p-6" : "pt-6"}>
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setInputValue("");
            setQrScanned(null);
            setError(null);
          }}
          className="w-full"
        >
          <TabsList className={`h-auto! grid w-full min-h-8 grid-cols-2 sm:grid-cols-3 mb-6 bg-muted shadow-sm ${compact ? "min-h-11 gap-3 p-3 sm:-mx-2 sm:w-[calc(100%+1rem)]" : "gap-2 sm:gap-2.5 p-2 sm:p-2.5"}`}>
            <TabsTrigger value="message" className="flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 text-[11px] sm:text-sm">
              <MessageSquare className="h-4 w-4" />
              <span>Message</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 text-[11px] sm:text-sm">
              <LinkIcon className="h-4 w-4" />
              <span>Link</span>
            </TabsTrigger>
            <TabsTrigger value="screenshot" className="flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 text-[11px] sm:text-sm">
              <ImageIcon className="h-4 w-4" />
              <span>Screenshot</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 text-[11px] sm:text-sm">
              <QrCode className="h-4 w-4" />
              <span>QR Code</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 text-[11px] sm:text-sm">
              <AudioWaveform className="h-4 w-4" />
              <span>Audio</span>
            </TabsTrigger>
            <TabsTrigger value="deepfake-image" className="flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 text-[11px] sm:text-sm">
              <ScanFace className="h-4 w-4" />
              <span>Face</span>
            </TabsTrigger>
          </TabsList>

          {error && (
            <div
              role="alert"
              className="bg-destructive/10 text-destructive p-3.5 rounded-lg mb-4 text-sm border border-destructive/20"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleAnalyze}>
            <TabsContent value="message" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="message">Suspicious Message</Label>
                <Textarea
                  id="message"
                  placeholder="Paste the suspicious email, SMS, or WhatsApp message here..."
                  className="min-h-[150px] resize-none bg-background"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground flex justify-between gap-4">
                  <span>Paste any suspicious message text or SMS.</span>
                  <span className="tabular-nums whitespace-nowrap">
                    {inputValue.length} chars
                  </span>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="url">Suspicious Link</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/..."
                  className="w-full bg-background"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Paste the full URL. We analyze its structure — we do not visit the website.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="screenshot" className="space-y-4 mt-0">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload a screenshot"
                className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-muted/50 hover:border-primary/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
                onClick={() => !inputValue && fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !inputValue) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                {inputValue ? (
                  <div className="flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={inputValue} alt="Uploaded preview" className="max-h-40 rounded-lg mb-4 object-contain shadow-soft" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInputValue("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4 mr-2" /> Remove Image
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 ring-1 ring-primary/10">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium mb-1">Click to upload screenshot</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">PNG, JPG or WEBP (max. 5MB)</p>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4 mt-0">
              <div className="border border-border rounded-xl bg-muted/30 p-6">
                {qrScanned ? (
                  <div className="flex flex-col items-center gap-3">
                    <Badge variant="secondary" className="max-w-full truncate text-xs">
                      Scanned: {qrScanned.slice(0, 60)}{qrScanned.length > 60 ? "…" : ""}
                    </Badge>
                    <p className="text-sm text-muted-foreground">Analyzing decoded content...</p>
                  </div>
                ) : (
                  <QrScanner
                    onDecoded={handleQrDecoded}
                    onError={(err) => setError(err)}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4 mt-0">
              <UnifiedAudioAnalyzer />
            </TabsContent>

            <TabsContent value="deepfake-image" className="space-y-4 mt-0">
              <DeepfakeImageDetector />
            </TabsContent>

            {/* Submit button — not shown for QR (auto-triggered), Audio, or Deepfake Image (own controls) */}
            {activeTab !== "qr" && activeTab !== "audio" && activeTab !== "deepfake-image" && (
              <div className="flex justify-end pt-4 border-t mt-6">
                {inputValue && (
                  <Button type="button" variant="ghost" className="mr-2" onClick={handleReset}>
                    Clear
                  </Button>
                )}
                <Button type="submit" disabled={!inputValue.trim()}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Analyze Now
                </Button>
              </div>
            )}
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
