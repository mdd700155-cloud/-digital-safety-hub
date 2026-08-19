"use client";

import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AudioWaveform,
  BrainCircuit,
  Info,
  RotateCcw,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeepfakeAnalysisResult, DeepfakeFeatureScore } from "@/types/voiceAnalysis";
import { cn } from "@/lib/utils";
import { formatDuration, formatFileSize } from "@/features/voice-analysis/audioUtils";

interface DeepfakeResultProps {
  result: DeepfakeAnalysisResult;
  onReset?: () => void;
}

const CATEGORY_LABELS: Record<DeepfakeFeatureScore["category"], string> = {
  spectral: "Spectral Analysis",
  temporal: "Temporal Analysis",
  prosody: "Prosody & Pitch",
  noise: "Noise Profile",
};

const CATEGORY_ORDER: DeepfakeFeatureScore["category"][] = [
  "spectral",
  "prosody",
  "temporal",
  "noise",
];

function ScoreBar({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const color =
    score >= 60
      ? "bg-red-500"
      : score >= 35
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div
      className={cn(
        "w-full rounded-full bg-muted/60",
        size === "sm" ? "h-1.5" : "h-2.5"
      )}
    >
      <div
        className={cn("rounded-full transition-all duration-700", color, size === "sm" ? "h-1.5" : "h-2.5")}
        style={{ width: `${Math.max(2, score)}%` }}
      />
    </div>
  );
}

function ProbabilityGauge({ probability }: { probability: number }) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (probability / 100) * circumference;

  const color =
    probability >= 65
      ? "stroke-red-500"
      : probability >= 35
        ? "stroke-amber-500"
        : "stroke-emerald-500";

  const textColor =
    probability >= 65
      ? "text-red-500"
      : probability >= 35
        ? "text-amber-500"
        : "text-emerald-500";

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="8"
          className="stroke-muted/40"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={cn("transition-all duration-1000", color)}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold tabular-nums", textColor)}>
          {probability}%
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">
          SYNTHETIC
        </span>
      </div>
    </div>
  );
}

export function DeepfakeResult({ result, onReset }: DeepfakeResultProps) {
  const [showFeatures, setShowFeatures] = useState(false);

  const levelMeta =
    result.riskLevel === "LIKELY_SYNTHETIC"
      ? {
          icon: ShieldX,
          title: "Likely Synthetic / AI-Generated",
          className: "border-destructive/30 bg-destructive/5 text-destructive",
          badge: "destructive" as const,
        }
      : result.riskLevel === "UNCERTAIN"
        ? {
            icon: ShieldAlert,
            title: "Uncertain — Could Be Real or Synthetic",
            className: "border-warning/40 bg-warning/10 text-warning-foreground",
            badge: "secondary" as const,
          }
        : {
            icon: ShieldCheck,
            title: "Likely Authentic Human Speech",
            className: "border-emerald-300 bg-emerald-50 text-emerald-700",
            badge: "secondary" as const,
          };

  const LevelIcon = levelMeta.icon;

  // Group features by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    features: result.featureScores.filter((f) => f.category === cat),
  })).filter((g) => g.features.length > 0);

  return (
    <div className="space-y-6">
      {/* Risk level header */}
      <div className={cn("rounded-xl border p-5 space-y-3", levelMeta.className)}>
        <div className="flex items-start gap-4">
          <ProbabilityGauge probability={result.probability} />
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <LevelIcon className="h-5 w-5 shrink-0" />
              <h3 className="text-lg font-semibold">{levelMeta.title}</h3>
            </div>
            <p className="text-sm opacity-90 leading-relaxed">{result.summary}</p>
            <div className="flex items-center gap-1.5 text-xs opacity-80 pt-1">
              <BrainCircuit className="h-3.5 w-3.5" />
              {result.aiUsed
                ? "Analyzed by Gemini AI + client-side audio signal processing."
                : "Analyzed by client-side audio signal processing only."}
            </div>
          </div>
        </div>
      </div>

      {/* Gemini assessment */}
      {result.geminiAssessment && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            AI Assessment
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.geminiAssessment.reasoning}
          </p>
          {result.geminiAssessment.observations.length > 0 && (
            <ul className="space-y-1.5 pl-1">
              {result.geminiAssessment.observations.map((obs, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary/60 shrink-0">•</span>
                  {obs}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Feature breakdown toggle */}
      <div className="rounded-xl border border-border overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
          onClick={() => setShowFeatures(!showFeatures)}
        >
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AudioWaveform className="h-4 w-4 text-primary" />
            Audio Feature Analysis
            <Badge variant="outline" className="text-[10px]">
              {result.featureScores.length} features
            </Badge>
          </h4>
          {showFeatures ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showFeatures && (
          <div className="border-t border-border p-4 space-y-5">
            {grouped.map((group) => (
              <div key={group.category} className="space-y-3">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h5>
                <div className="space-y-3">
                  {group.features.map((feature) => (
                    <div key={feature.name} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{feature.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {feature.score}/100
                        </span>
                      </div>
                      <ScoreBar score={feature.score} size="sm" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <h4 className="text-sm font-medium">What should you do?</h4>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed text-muted-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {result.disclaimer}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Duration: {formatDuration(result.metadata.durationSeconds)}</span>
          <span>Type: {result.metadata.fileType}</span>
          <span>Size: {formatFileSize(result.metadata.fileSizeBytes)}</span>
          <span>AI: {result.aiUsed ? "Used" : "Unavailable"}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-t pt-4">
        {onReset && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={onReset} className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" />
              Analyze Another Audio File
            </Button>
          </div>
        )}
        <Link
          href="/report"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <LifeBuoy className="h-4 w-4" />
          Report an incident
        </Link>
      </div>
    </div>
  );
}
