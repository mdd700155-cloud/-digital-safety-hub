"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AudioWaveform, ScanFace, UploadCloud, X, QrCode, Mail, FileText, Link2, MessageSquare } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import { ResultDisplay } from "./ResultDisplay";
import { QrScanner } from "./QrScanner";
import { AnalysisLoader } from "./AnalysisLoader";
import { UnifiedAudioAnalyzer } from "../voice-analysis/UnifiedAudioAnalyzer";
import { DeepfakeImageDetector } from "@/features/deepfake-detection/DeepfakeImageDetector";

const STORAGE_KEY = "scam_checker_persisted_state_v2";
const ALLOWED_ACTIVE_TABS = new Set(["url", "email", "message-qr", "image-voice"]);

// Migration for old persisted values -> new tab ids (frontend-only rename) — Mail first
const TAB_MIGRATION: Record<string, string> = {
  general: "email",
  "url-mail": "email",
  audio: "image-voice",
  "deepfake-image": "image-voice",
};

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
  outputLanguage: string;
}

function loadPersistedState(): PersistedScamCheckerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedScamCheckerState;
    if (typeof parsed === "object" && parsed !== null) {
      const rawTab = typeof parsed.activeTab === "string" ? parsed.activeTab : "email";
      const migratedTab = TAB_MIGRATION[rawTab] ?? rawTab;
      return {
        activeTab: ALLOWED_ACTIVE_TABS.has(migratedTab) ? migratedTab : "email",
        inputValue: typeof parsed.inputValue === "string" ? parsed.inputValue : "",
        outputLanguage: typeof parsed.outputLanguage === "string" ? parsed.outputLanguage : "en",
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
  const [activeTab, setActiveTab] = useState<string>("email");
  const [inputValue, setInputValue] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<string>("en");

  // File upload state — tracks name/size for compact display (now only for Email tab)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  // QR scanner state (only for message-qr tab)
  const [showQrScanner, setShowQrScanner] = useState(false);

  const emailFileRef = useRef<HTMLInputElement>(null);
  const messageFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const persisted = loadPersistedState();
    queueMicrotask(() => {
      if (persisted) {
        setActiveTab(persisted.activeTab);
        setInputValue(persisted.inputValue);
        setOutputLanguage(persisted.outputLanguage);
      }
      setHasLoadedPersistedState(true);
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedPersistedState) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeTab, inputValue, outputLanguage }));
    } catch {
      // ignore quota errors
    }
  }, [hasLoadedPersistedState, activeTab, inputValue, outputLanguage]);

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
        body: JSON.stringify({
          content,
          ...(typeHint ? { type: typeHint } : {}),
          ...(outputLanguage && outputLanguage !== "en" ? { language: outputLanguage } : {}),
        }),
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
    if (emailFileRef.current) emailFileRef.current.value = "";
    if (messageFileRef.current) messageFileRef.current.value = "";
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  if (result) {
    const isEmlForward =
      uploadedFile?.name.toLowerCase().endsWith(".eml") ||
      result.pipelineTrace?.inputType === "email";
    return (
      <ResultDisplay
        result={result}
        onReset={handleReset}
        reportedContent={inputValue}
        contentType={result.pipelineTrace?.inputType ?? activeTab}
        emlFileName={isEmlForward ? uploadedFile?.name ?? "email.eml" : undefined}
        emlRaw={isEmlForward ? inputValue : undefined}
      />
    );
  }

  if (isAnalyzing) {
    // map 4-tab ids to loader-friendly labels (frontend only)
    const loaderType = activeTab === "url" || activeTab === "email" || activeTab === "message-qr" ? "general" : activeTab;
    return <AnalysisLoader key={activeTab} contentType={loaderType} compact={compact} />;
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
          <TabsList className={`h-auto! grid w-full min-h-8 grid-cols-4 mb-6 bg-muted shadow-sm ${compact ? "min-h-11 gap-1 p-1.5 sm:-mx-2 sm:w-[calc(100%+1rem)]" : "gap-1 sm:gap-2 p-1.5 sm:p-2"}`}>
            <TabsTrigger value="email" className="flex items-center justify-center gap-1 px-1 sm:px-2 py-1.5 text-[10px] sm:text-xs leading-tight">
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Mail</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center justify-center gap-1 px-1 sm:px-2 py-1.5 text-[10px] sm:text-xs leading-tight">
              <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">URL</span>
            </TabsTrigger>
            <TabsTrigger value="message-qr" className="flex items-center justify-center gap-1 px-1 sm:px-2 py-1.5 text-[10px] sm:text-xs leading-tight">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate hidden sm:inline">Msg · QR</span>
              <span className="truncate sm:hidden">Msg</span>
            </TabsTrigger>
            <TabsTrigger value="image-voice" className="flex items-center justify-center gap-1 px-1 sm:px-2 py-1.5 text-[10px] sm:text-xs leading-tight">
              <ScanFace className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate hidden sm:inline">Image & Voice</span>
              <span className="truncate sm:hidden">Media</span>
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
            {/* Tab 1: Mail — email headers / .eml (now first) */}
            <TabsContent value="email" className="space-y-4 mt-0">
              <input
                type="file"
                accept=".eml,.txt,message/rfc822"
                className="hidden"
                ref={emailFileRef}
                onChange={handleFileUpload}
              />

              <div className="space-y-2">
                {isFileUpload ? (
                  <div className="border border-border rounded-lg p-4 bg-muted/30 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {uploadedFile.name.toLowerCase().endsWith(".eml") ? (
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
                        if (emailFileRef.current) emailFileRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4 mr-1.5" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Textarea
                      placeholder="Paste full email content / headers here, or upload .eml…"
                      className="min-h-[160px] pb-14 resize-none bg-background shadow-sm text-sm"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => emailFileRef.current?.click()}
                      >
                        <UploadCloud className="h-4 w-4 mr-1.5" />
                        Upload .eml
                      </Button>
                      <span className="hidden sm:inline text-xs text-muted-foreground ml-1">
                        SPF / DKIM / relay check
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground flex justify-between gap-4 mt-2">
                  <span>Paste headers or upload .eml — we parse auth signals.</span>
                  {!isFileUpload && (
                    <span className="tabular-nums whitespace-nowrap">
                      {inputValue.length} chars
                    </span>
                  )}
                </p>
              </div>
            </TabsContent>

            {/* Tab 2: URL — clean paste-only, same POST /api/analyze */}
            <TabsContent value="url" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste a suspicious link or URL here…  e.g. https://example.com/verify"
                  className="min-h-[160px] resize-none bg-background shadow-sm text-sm"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground flex justify-between gap-4">
                  <span>We check phishing signals without visiting the site.</span>
                  <span className="tabular-nums whitespace-nowrap">{inputValue.length} chars</span>
                </p>
              </div>
            </TabsContent>

            {/* Tab 2: Message + QR + Screenshot — frontend only, same POST /api/analyze */}
            <TabsContent value="message-qr" className="space-y-4 mt-0">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={messageFileRef}
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
                      <img src={inputValue} alt="Screenshot preview" className="max-h-48 rounded-lg mb-4 object-contain shadow-soft" />
                      <p className="text-xs text-muted-foreground mb-3">Screenshot ready — we&apos;ll check text inside the image.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInputValue("");
                          if (messageFileRef.current) messageFileRef.current.value = "";
                        }}
                      >
                        <X className="h-4 w-4 mr-2" /> Remove Screenshot
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Textarea
                        placeholder="Paste suspicious message (SMS / WhatsApp / Telegram) here..."
                        className="min-h-[160px] pb-14 resize-none bg-background shadow-sm text-sm"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => messageFileRef.current?.click()}
                        >
                          <UploadCloud className="h-4 w-4 mr-1.5" />
                          Screenshot
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
                    <span>Messages, QR links & screenshots checked the same way.</span>
                    {!isImageUpload && (
                      <span className="tabular-nums whitespace-nowrap">
                        {inputValue.length} chars
                      </span>
                    )}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Tab 3: Image & Voice — stacked forensic detectors (no backend change) */}
            <TabsContent value="image-voice" className="space-y-6 mt-0">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/10">
                      <ScanFace className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-semibold">Image — Deepfake & AI Check</h3>
                    <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">Photo forensics</span>
                  </div>
                  <DeepfakeImageDetector />
                </div>

                <div className="border-t border-border/60" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/10">
                      <AudioWaveform className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-semibold">Voice — Cloning & Scam Check</h3>
                    <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">Audio forensics</span>
                  </div>
                  <UnifiedAudioAnalyzer />
                </div>
              </div>
            </TabsContent>

            {/* Shared output-language selector — visible for text tabs (url / email / message-qr) */}
            {(activeTab === "url" || activeTab === "email" || activeTab === "message-qr") && !showQrScanner && (
              <div className="space-y-2 pt-2">
                <label htmlFor="output-language" className="text-sm font-medium leading-none">Output Language</label>
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
            )}

            {/* Submit buttons — only for text tabs and when not scanning QR */}
            {(activeTab === "url" || activeTab === "email" || activeTab === "message-qr") && !showQrScanner && (
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
