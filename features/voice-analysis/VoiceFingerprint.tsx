"use client";

import { SignalSeverity, VoiceSignal } from "@/types/voiceAnalysis";
import { cn } from "@/lib/utils";

const severityColor: Record<SignalSeverity, string> = {
  HIGH: "bg-destructive",
  MEDIUM: "bg-warning",
  LOW: "bg-primary",
};

export function VoiceFingerprint({ signals }: { signals: VoiceSignal[] }) {
  if (signals.length === 0) return null;

  return (
    <div className="space-y-3">
      {signals.slice(0, 8).map((signal) => (
        <div key={signal.id} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium truncate">{signal.label}</span>
            <span className="text-muted-foreground text-xs tabular-nums shrink-0">
              {signal.confidence}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full", severityColor[signal.severity])}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}