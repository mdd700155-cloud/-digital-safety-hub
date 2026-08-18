"use client";

import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Link as LinkIcon, Image as ImageIcon, QrCode, Loader2, UploadCloud, Camera, X } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import { ResultDisplay } from "./ResultDisplay";

interface ScamCheckerProps {
  compact?: boolean;
}

export function ScamChecker({ compact = false }: ScamCheckerProps) {
  const [activeTab, setActiveTab] = useState<string>("message");
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && activeTab !== 'qr') return;
    
    // For QR mock, provide a fake URL if empty just to demonstrate
    const payloadContent = (activeTab === 'qr' && !inputValue.trim()) ? "http://mock-qr-scanned-url.com" : inputValue;

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: activeTab,
          content: payloadContent
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
  };

  const handleReset = () => {
    setResult(null);
    setInputValue("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (result) {
    return <ResultDisplay result={result} onReset={handleReset} />;
  }

  if (isAnalyzing) {
    return (
      <Card className="border shadow-sm min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-center p-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Analyzing your submission...</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Checking against known threat patterns, structural heuristics, and context. This usually takes a few seconds.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      {!compact && (
        <CardHeader>
          <CardTitle>What would you like to check?</CardTitle>
          <CardDescription>
            Select the type of content you want to analyze for potential threats.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-4 sm:p-6" : ""}>
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setInputValue(""); setError(null); }} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="message" className="flex items-center justify-center">
              <MessageSquare className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Message</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center justify-center">
              <LinkIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Link</span>
            </TabsTrigger>
            <TabsTrigger value="screenshot" className="flex items-center justify-center">
              <ImageIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Screenshot</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center justify-center">
              <QrCode className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">QR Code</span>
            </TabsTrigger>
          </TabsList>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
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
                  className="min-h-[150px] resize-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground flex justify-between">
                  <span>Try pasting a message containing &quot;urgent&quot; or &quot;bank&quot; to test results.</span>
                  <span>{inputValue.length} chars</span>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="url">Suspicious Link</Label>
                <Input 
                  id="url" 
                  type="url" 
                  placeholder="https://example.com/login..." 
                  className="w-full"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ensure you paste the full URL including http:// or https://
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
                className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer" 
                onClick={() => !inputValue && fileInputRef.current?.click()}
              >
                {inputValue ? (
                  <div className="flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={inputValue} alt="Uploaded preview" className="max-h-40 rounded mb-4 object-contain" />
                    <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setInputValue(""); if(fileInputRef.current) fileInputRef.current.value = ""; }}>
                      <X className="h-4 w-4 mr-2" /> Remove Image
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium mb-1">Click to upload screenshot</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      PNG, JPG or WEBP (max. 5MB)
                    </p>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4 mt-0">
              <div className="border border-border rounded-lg bg-muted/30 p-8 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-background border shadow-sm rounded-xl flex items-center justify-center mb-4 relative overflow-hidden group cursor-pointer" onClick={() => setInputValue("http://mock-qr-scanned-url.com")}>
                  <QrCode className="h-8 w-8 text-muted-foreground group-hover:opacity-0 transition-opacity" />
                  <Camera className="h-8 w-8 text-primary absolute opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100" />
                </div>
                <h3 className="font-medium mb-2">Scan a QR Code</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  Use your device camera to safely scan and analyze a QR code before visiting its destination.
                </p>
                <Button type="button" variant="outline" onClick={() => setInputValue("http://mock-qr-scanned-url.com")}>
                  <Camera className="h-4 w-4 mr-2" />
                  Simulate QR Scan (Mock)
                </Button>
                {inputValue && <Badge variant="secondary" className="mt-4">Mock QR Scanned</Badge>}
              </div>
            </TabsContent>

            <div className="flex justify-end pt-4 border-t mt-6">
              {inputValue && (
                <Button type="button" variant="ghost" className="mr-2" onClick={handleReset}>
                  Clear
                </Button>
              )}
              <Button type="submit" disabled={!inputValue.trim() && activeTab !== 'qr'}>
                Analyze Now
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
