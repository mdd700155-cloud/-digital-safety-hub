"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ANALYSIS_STEPS: Record<string, string[]> = {
  message: [
    "Initializing threat scan…",
    "Parsing message structure…",
    "Scanning for urgency & fear triggers…",
    "Matching known scam phrase patterns…",
    "Evaluating sender impersonation cues…",
    "Cross-referencing community reports…",
    "Compiling risk assessment…",
  ],
  url: [
    "Initializing link analysis…",
    "Parsing URL structure & hostname…",
    "Checking for typosquatting patterns…",
    "Analyzing domain age indicators…",
    "Detecting suspicious redirect paths…",
    "Evaluating HTTPS & certificate cues…",
    "Compiling risk assessment…",
  ],
  screenshot: [
    "Initializing image scan…",
    "Processing screenshot data…",
    "Extracting visible text & links…",
    "Scanning for phishing layout cues…",
    "Checking brand impersonation signals…",
    "Evaluating visual red flags…",
    "Compiling risk assessment…",
  ],
  qr: [
    "Initializing QR payload scan…",
    "Decoding embedded content…",
    "Analyzing destination type…",
    "Checking URL structure heuristics…",
    "Scanning for known malicious patterns…",
    "Compiling risk assessment…",
  ],
};

const DEFAULT_STEPS = ANALYSIS_STEPS.message;

interface AnalysisLoaderProps {
  contentType?: string;
  compact?: boolean;
}

export function AnalysisLoader({ contentType = "message", compact = false }: AnalysisLoaderProps) {
  const steps = useMemo(
    () => ANALYSIS_STEPS[contentType] ?? DEFAULT_STEPS,
    [contentType]
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const stepTimer = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % steps.length);
    }, 2400);

    return () => window.clearInterval(stepTimer);
  }, [steps]);

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        const bump = 3 + Math.random() * 7;
        return Math.min(current + bump, 92);
      });
      setTick((t) => t + 1);
    }, 450);

    return () => window.clearInterval(progressTimer);
  }, []);

  const currentStep = steps[stepIndex];
  const stepNumber = stepIndex + 1;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-primary/20 shadow-lift",
        compact ? "min-h-[360px]" : "min-h-[400px]"
      )}
    >
      {/* Ambient grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[linear-gradient(oklch(0.5_0.08_210_/_0.06)_1px,transparent_1px),linear-gradient(90deg,oklch(0.5_0.08_210_/_0.06)_1px,transparent_1px)] bg-size-[24px_24px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.55_0.1_200_/_0.12),transparent_65%)]"
      />

      {/* Scan line */}
      <div aria-hidden className="analysis-scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/40" />

      <div className="relative flex min-h-[inherit] flex-col items-center justify-center px-6 py-10 text-center">
        {/* Radar core */}
        <div className="relative mb-8 flex h-36 w-36 items-center justify-center">
          <div className="analysis-radar-ring absolute inset-0 rounded-full border border-primary/25" />
          <div className="analysis-radar-ring-delay absolute inset-3 rounded-full border border-primary/20" />
          <div className="analysis-radar-ring-delay-2 absolute inset-6 rounded-full border border-primary/15" />
          <div className="analysis-radar-sweep absolute inset-0 rounded-full" />
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lift ring-4 ring-primary/15">
            <ShieldCheck className="h-8 w-8" />
          </div>
        </div>

        {/* Status header */}
        <div className="mb-2 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary/80">
            Threat analysis active
          </p>
        </div>

        <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
          Scanning your submission
        </h3>

        {/* Dynamic step text */}
        <div
          className="mt-4 min-h-[3.5rem] w-full max-w-md"
          aria-live="polite"
          aria-atomic="true"
        >
          <p
            key={`${contentType}-${stepIndex}`}
            className="analysis-step-text font-mono text-sm text-muted-foreground sm:text-[15px]"
          >
            <span className="text-primary/70">&gt;</span> {currentStep}
            <span className="analysis-cursor ml-0.5 inline-block w-[2px] bg-primary" />
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-full max-w-xs space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-primary/10 ring-1 ring-primary/10">
            <div
              className="analysis-progress-bar h-full rounded-full bg-gradient-to-r from-primary/70 via-primary to-[oklch(0.55_0.1_185)] transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-mono text-[10px] text-muted-foreground/80">
            Step {stepNumber}/{steps.length} · cycle {String(tick).padStart(2, "0")}
          </p>
        </div>

        <p className="mt-6 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Running heuristic checks against known threat patterns. Results are guidance only — never a guarantee of safety.
        </p>
      </div>
    </Card>
  );
}
