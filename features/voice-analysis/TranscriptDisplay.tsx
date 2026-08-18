"use client";

import { useMemo, useState } from "react";
import { Eye, Info } from "lucide-react";
import { VoiceSignal } from "@/types/voiceAnalysis";
import { cn } from "@/lib/utils";

interface HighlightMatch {
  signal: VoiceSignal;
  evidence: string;
}

interface Segment {
  text: string;
  matches: HighlightMatch[];
}

function buildSegments(transcript: string, signals: VoiceSignal[]): Segment[] {
  const lower = transcript.toLowerCase();

  const intervals: { start: number; end: number; match: HighlightMatch }[] = [];
  for (const signal of signals) {
    for (const evidence of signal.evidence) {
      const idx = lower.indexOf(evidence.toLowerCase());
      if (idx >= 0) {
        intervals.push({
          start: idx,
          end: idx + evidence.length,
          match: { signal, evidence },
        });
      }
    }
  }

  if (intervals.length === 0) {
    return [{ text: transcript, matches: [] }];
  }

  intervals.sort((a, b) => a.start - b.start || b.end - a.end);

  const segments: Segment[] = [];
  let cursor = 0;
  let i = 0;

  while (i < intervals.length) {
    let end = intervals[i].end;
    const matches: HighlightMatch[] = [intervals[i].match];
    let j = i + 1;

    while (j < intervals.length && intervals[j].start <= end) {
      end = Math.max(end, intervals[j].end);
      if (!matches.some((m) => m.signal.id === intervals[j].match.signal.id)) {
        matches.push(intervals[j].match);
      }
      j++;
    }

    const start = intervals[i].start;
    if (start > cursor) {
      segments.push({ text: transcript.slice(cursor, start), matches: [] });
    }
    segments.push({ text: transcript.slice(start, end), matches });
    cursor = end;
    i = j;
  }

  if (cursor < transcript.length) {
    segments.push({ text: transcript.slice(cursor), matches: [] });
  }

  return segments;
}

interface TranscriptDisplayProps {
  transcript: string;
  signals: VoiceSignal[];
}

export function TranscriptDisplay({ transcript, signals }: TranscriptDisplayProps) {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const segments = useMemo(
    () => buildSegments(transcript, signals),
    [transcript, signals]
  );

  const flaggedCount = signals.reduce(
    (sum, s) => sum + s.evidence.length,
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          {flaggedCount > 0
            ? `${flaggedCount} suspicious phrase${flaggedCount === 1 ? "" : "s"} highlighted — tap one to see why`
            : "No suspicious phrases detected in the transcript"}
        </p>
      </div>

      <blockquote className="border-l-4 border-primary/30 bg-muted/30 rounded-r-xl px-4 py-3 text-sm leading-relaxed text-foreground/90">
        {segments.map((segment, index) =>
          segment.matches.length === 0 ? (
            <span key={index}>{segment.text}</span>
          ) : (
            <button
              key={index}
              type="button"
              onClick={() =>
                setActiveSegment(activeSegment === index ? null : index)
              }
              aria-expanded={activeSegment === index}
              className={cn(
                "mx-0.5 rounded px-0.5 underline decoration-wavy underline-offset-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                segment.matches.some((m) => m.signal.severity === "HIGH")
                  ? "bg-destructive/10 text-destructive decoration-destructive/60 hover:bg-destructive/20"
                  : segment.matches.some((m) => m.signal.severity === "MEDIUM")
                    ? "bg-warning/15 text-warning-foreground decoration-warning/70 hover:bg-warning/25"
                    : "bg-primary/10 text-foreground decoration-primary/50 hover:bg-primary/20"
              )}
            >
              {segment.text}
            </button>
          )
        )}
      </blockquote>

      {activeSegment !== null && segments[activeSegment]?.matches.length > 0 && (
        <div className="border border-border rounded-xl bg-background p-4 space-y-4 shadow-sm">
          {segments[activeSegment].matches.map((match) => (
            <div key={match.signal.id} className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  {match.signal.label}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  confidence {match.signal.confidence}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                “{match.evidence}”
              </p>
              <p className="text-sm">{match.signal.explanation}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">What to do: </span>
                {match.signal.recommendation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}