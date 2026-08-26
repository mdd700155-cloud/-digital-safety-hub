"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AudioWaveform, ScanFace, UploadCloud, X, QrCode, Mail, FileText } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import { ResultDisplay } from "./ResultDisplay";
import { QrScanner } from "./QrScanner";
import { AnalysisLoader } from "./AnalysisLoader";
import { UnifiedAudioAnalyzer } from "../voice-analysis/UnifiedAudioAnalyzer";
import { DeepfakeImageDetector } from "@/features/deepfake-detection/DeepfakeImageDetector";

const STORAGE_KEY = "scam_checker_persisted_state_v2";
const ALLOWED_ACTIVE_TABS = new Set(["general", "audio", "deepfake-image"]);

const OUTPUT_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "or", label: "ଓଡ଼ିଆ" },
];

interface PersistedScamCheckerState {
  activeTab: string;
  inputValue: string;
<<<<<<< HEAD
  qrScanned: string | null;
  outputLanguage: string;
=======
>>>>>>> origin/saad2
}

function loadPersistedState(): PersistedScamCheckerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedScamCheckerState;
    if (typeof parsed === "object" && parsed !== null) {
      return {
        activeTab: ALLOWED_ACTIVE_TABS.has(parsed.activeTab) ? parsed.activeTab : "general",
        inputValue: typeof parsed.inputValue === "string" ? parsed.inputValue : "",
<<<<<<< HEAD
        qrScanned: typeof parsed.qrScanned === "string" ? parsed.qrScanned : null,
        outputLanguage: typeof parsed.outputLanguage === "string" ? parsed.outputLanguage : "en",
=======
>>>>>>> origin/saad2
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
  const [hasLoadedPersistedState, setHasLoadedPersistedState] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [inputValue, setInputValue] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
  const [qrScanned, setQrScanned] = useState<string | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<string>("en");
=======
  
  // File upload state — tracks name/size for compact display
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  // QR scanner state
  const [showQrScanner, setShowQrScanner] = useState(false);
>>>>>>> origin/saad2

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const persisted = loadPersistedState();
    queueMicrotask(() => {
      if (persisted) {
        setActiveTab(persisted.activeTab);
        setInputValue(persisted.inputValue);
<<<<<<< HEAD
        setQrScanned(persisted.qrScanned);
        setOutputLanguage(persisted.outputLanguage);
=======
>>>>>>> origin/saad2
      }
      setHasLoadedPersistedState(true);
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedPersistedState) return;
<<<<<<< HEAD
    const toSave: PersistedScamCheckerState = { activeTab, inputValue, qrScanned, outputLanguage };
=======
>>>>>>> origin/saad2
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeTab, inputValue }));
    } catch {
      // ignore quota errors
    }
<<<<<<< HEAD
  }, [hasLoadedPersistedState, activeTab, inputValue, qrScanned, outputLanguage]);
=======
  }, [hasLoadedPersistedState, activeTab, inputValue]);
>>>>>>> origin/saad2

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInputValue(event.target.result as string);
        setError(null);
      }
    };

    if (file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
    } else {
      // Text file (.eml, .txt) — store metadata for compact card display
      setUploadedFile({ name: file.name, size: file.size });
      reader.readAsText(file);
    }
  };

  const submitAnalysis = useCallback(async (content: string, typeHint?: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setShowQrScanner(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        body: JSON.stringify({ type, content, language: outputLanguage }),
=======
        // If typeHint is provided (like "url" from QR), pass it. 
        // Otherwise omit 'type' to rely on backend auto-detection.
        body: JSON.stringify({ content, ...(typeHint ? { type: typeHint } : {}) }),
>>>>>>> origin/saad2
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
  }, [outputLanguage]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    await submitAnalysis(inputValue);
  };

  const handleQrDecoded = useCallback(async (text: string) => {
    setInputValue(text);
    const typeHint = /^https?:\/\//i.test(text.trim()) ? "url" : "message";
    await submitAnalysis(text, typeHint);
  }, [submitAnalysis]);

  const handleReset = () => {
    setResult(null);
    setInputValue("");
    setError(null);
    setUploadedFile(null);
    setShowQrScanner(false);
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
    // For loader, just pass the general tab
    return <AnalysisLoader key={activeTab} contentType={activeTab} compact={compact} />;
  }

  const isImageUpload = inputValue.startsWith("data:image/");
  const isFileUpload = uploadedFile !== null && !isImageUpload;

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
            setError(null);
            setUploadedFile(null);
            setShowQrScanner(false);
          }}
          className="w-full"
        >
          <TabsList className={`h-auto! grid w-full min-h-8 grid-cols-3 mb-6 bg-muted shadow-sm ${compact ? "min-h-11 gap-3 p-3 sm:-mx-2 sm:w-[calc(100%+1rem)]" : "gap-2 sm:gap-2.5 p-2 sm:p-2.5"}`}>
            <TabsTrigger value="general" className="flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 text-[11px] sm:text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>General</span>
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
<<<<<<< HEAD
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
              <div className="space-y-2">
                <Label htmlFor="output-language">Output Language</Label>
                <select
                  id="output-language"
                  value={outputLanguage}
                  onChange={(e) => setOutputLanguage(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {OUTPUT_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Analysis results will be shown in this language.
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
=======
            <TabsContent value="general" className="space-y-4 mt-0">
>>>>>>> origin/saad2
              <input
                type="file"
                accept="image/*,.eml,.txt"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />

              {showQrScanner ? (
                <div className="border border-border rounded-xl bg-muted/30 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm">Scan QR Code</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowQrScanner(false)}>
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                  </div>
                  <QrScanner
                    onDecoded={handleQrDecoded}
                    onError={(err) => setError(err)}
                  />
                </div>
              ) : (
                <div className="space-y-2 relative">
                  {isImageUpload ? (
                    <div className="border border-border rounded-lg p-4 bg-muted/30 flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={inputValue} alt="Uploaded preview" className="max-h-48 rounded-lg mb-4 object-contain shadow-soft" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInputValue("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="h-4 w-4 mr-2" /> Remove Image
                      </Button>
                    </div>
                  ) : isFileUpload ? (
                    <div className="border border-border rounded-lg p-4 bg-muted/30 flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {uploadedFile.name.endsWith(".eml") ? (
                          <Mail className="h-6 w-6" />
                        ) : (
                          <FileText className="h-6 w-6" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB · Ready to analyze
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInputValue("");
                          setUploadedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="h-4 w-4 mr-1.5" /> Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Textarea
                        placeholder="Paste a suspicious link, message, or raw email headers here..."
                        className="min-h-[160px] pb-14 resize-none bg-background shadow-sm text-sm"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                      
                      {/* Action Bar inside textarea */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadCloud className="h-4 w-4 mr-1.5" />
                          Upload (.eml, image)
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => setShowQrScanner(true)}
                        >
                          <QrCode className="h-4 w-4 mr-1.5" />
                          Scan QR
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground flex justify-between gap-4 mt-2">
                    <span>We automatically detect links, emails, and messages.</span>
                    {!isImageUpload && !isFileUpload && (
                      <span className="tabular-nums whitespace-nowrap">
                        {inputValue.length} chars
                      </span>
                    )}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="audio" className="space-y-4 mt-0">
              <UnifiedAudioAnalyzer />
            </TabsContent>

            <TabsContent value="deepfake-image" className="space-y-4 mt-0">
              <DeepfakeImageDetector />
            </TabsContent>

            {/* Submit button — not shown for Audio or Deepfake Image (own controls) or when scanning QR */}
            {activeTab === "general" && !showQrScanner && (
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
