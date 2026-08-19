"use client";

import { AlertTriangle, CheckCircle, ShieldAlert, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ResultDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultDisplay({ result, onReset }: ResultDisplayProps) {
  const isSafe = result.level === "SAFE";
  const isSuspicious = result.level === "SUSPICIOUS";
  const isHighRisk = result.level === "HIGH_RISK";

  const isDangerSource = (indicator: string) =>
    indicator.startsWith("[ML]") ||
    indicator.toLowerCase().includes("urlhaus") ||
    /^\[(STRONG|MODERATE)\]/.test(indicator);

  const sourceLabel = (indicator: string) => {
    if (indicator.startsWith("[ML]")) return "ML Model";
    if (indicator.toLowerCase().includes("urlhaus")) return "URLhaus";
    return "URL Analysis";
  };

  const displayText = (indicator: string) =>
    indicator.replace(/^\[(STRONG|MODERATE)\] /, "");

  const dangerSourceIndicators = result.warningIndicators
    .filter(isDangerSource)
    .filter((i) => !(isSafe && i.startsWith("[ML]")));
  const otherIndicators = result.warningIndicators.filter((i) => !isDangerSource(i));
  const showIndicators = !isSafe || dangerSourceIndicators.length > 0;

  const styles = {
    card: isSafe
      ? "border-success/40"
      : isSuspicious
        ? "border-warning/50"
        : "border-danger/50",
    iconWrap: isSafe
      ? "bg-success/10 text-success ring-1 ring-success/20"
      : isSuspicious
        ? "bg-warning/10 text-warning-foreground ring-1 ring-warning/20"
        : "bg-danger/10 text-danger ring-1 ring-danger/20",
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className={cn("border-2 shadow-soft overflow-hidden", styles.card)}>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <div className={cn("p-3 rounded-full", styles.iconWrap)}>
              {isSafe && <ShieldCheck className="h-8 w-8" />}
              {isSuspicious && <AlertTriangle className="h-8 w-8" />}
              {isHighRisk && <ShieldAlert className="h-8 w-8" />}
            </div>
            <div>
              <CardTitle className="text-2xl">
                {isSafe && "No obvious threat detected"}
                {isSuspicious && "Suspicious"}
                {isHighRisk && "High Risk"}
              </CardTitle>
              <CardDescription className="text-base mt-1 flex items-center gap-2">
                <span className="text-foreground/80 font-medium">Analysis Confidence</span>
                <Badge variant="secondary">{result.confidence}</Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4 border border-border/40">
            <p className="text-sm leading-relaxed">{result.summary}</p>
          </div>

          {showIndicators && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2 text-danger" />
                Warning Indicators Detected
              </h4>
              <ul className="space-y-2.5">
                {dangerSourceIndicators.map((indicator: string, idx: number) => (
                  <li
                    key={`source-${idx}`}
                    className="flex items-start text-sm rounded-lg bg-danger/10 border border-danger/30 p-3"
                  >
                    <Badge
                      variant="destructive"
                      className="bg-danger text-danger-foreground border-danger/40 mr-2.5 mt-0.5 flex-shrink-0"
                    >
                      {sourceLabel(indicator)}
                    </Badge>
                    <span className="leading-relaxed text-danger font-medium">
                      {displayText(indicator)}
                    </span>
                  </li>
                ))}
                {otherIndicators.map((indicator: string, idx: number) => (
                  <li key={idx} className="flex items-start text-sm">
                    <span className="mr-2.5 mt-1.5 w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                    <span className="leading-relaxed">{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-3 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 mr-2 text-success" />
              Recommended Actions
            </h4>
            <ul className="space-y-2.5">
              {result.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start text-sm">
                  <span className="mr-2.5 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2 bg-muted/20 border-t">
          <Button onClick={onReset} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Something Else
          </Button>
          {!isSafe && (
            <Link
              href="/report"
              className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
            >
              Report & Recover <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </CardFooter>
      </Card>

      {/* <p className="text-xs text-center text-muted-foreground">
        Note: This is an automated frontend analysis. Always use your best judgment.
      </p> */}
    </div>
  );
}