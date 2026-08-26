"use client";

import {
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Users,
  Activity,
  Server,
  MapPin,
  Calendar,
  Mail,
} from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WarnCommunityButton } from "@/components/warn-community-button";

interface ResultDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
  reportedContent?: string;
  contentType?: string;
}

export function ResultDisplay({
  result,
  onReset,
  reportedContent,
  contentType,
}: ResultDisplayProps) {
  const isSafe = result.level === "SAFE";
  const isSuspicious = result.level === "SUSPICIOUS";
  const isHighRisk = result.level === "HIGH_RISK";

  const isDangerSource = (indicator: string) =>
    indicator.startsWith("[ML]") ||
    indicator.toLowerCase().includes("urlhaus") ||
    /^\[(STRONG|MODERATE)\]/.test(indicator);

  const mlDisplayText = (indicator: string) => {
    if (indicator.includes("LOW_RISK_SIGNAL")) {
      return "We didn't find anything suspicious in this link.";
    }
    if (indicator.includes("SUSPICIOUS_SIGNAL")) {
      return "This link looks unusual — please be careful.";
    }
    if (indicator.includes("HIGH_RISK_SIGNAL")) {
      return "This link matches known scam patterns — don't share any details.";
    }
    return "An automated scan flagged something unusual — please be cautious.";
  };

  const friendlyIndicatorText = (indicator: string) => {
    if (indicator.startsWith("[ML]")) return mlDisplayText(indicator);
    if (indicator.toLowerCase().includes("urlhaus")) {
      return "This URL is reported as associated with malware distribution (verified threat database).";
    }
    return indicator.replace(/^\[(STRONG|MODERATE|WEAK)\] /, "");
  };

  const indicatorSeverity = (
    indicator: string
  ): "high" | "medium" | "low" => {
    if (indicator.toLowerCase().includes("urlhaus")) return "high";
    if (indicator.startsWith("[ML]")) {
      return indicator.includes("HIGH_RISK_SIGNAL")
        ? "high"
        : "medium";
    }
    if (/^\[STRONG\]/.test(indicator)) return "high";
    if (/^\[MODERATE\]/.test(indicator)) return "medium";
    if (/^\[WEAK\]/.test(indicator)) return "low";
    return "medium";
  };

  const severityStyles: Record<
    "high" | "medium" | "low",
    {
      badge: string;
      badgeLabel: string;
      border: string;
      bg: string;
      dot: string;
    }
  > = {
    high: {
      badge: "bg-destructive/10 text-destructive border-destructive/20",
      badgeLabel: "Strong signal",
      border: "border-l-destructive",
      bg: "bg-destructive/5",
      dot: "bg-destructive",
    },
    medium: {
      badge: "bg-warning/10 text-warning-foreground border-warning/30",
      badgeLabel: "Caution",
      border: "border-l-warning",
      bg: "bg-warning/5",
      dot: "bg-warning",
    },
    low: {
      badge: "bg-muted text-muted-foreground border-border",
      badgeLabel: "Minor note",
      border: "border-l-border",
      bg: "bg-muted/30",
      dot: "bg-muted-foreground",
    },
  };

  const visibleIndicators = result.warningIndicators.filter(
    (indicator) =>
      !indicator.startsWith("[ML]") ||
      !indicator.includes("LOW_RISK_SIGNAL")
  );
  const dangerSourceIndicators = visibleIndicators
    .filter(isDangerSource)
    .filter((i) => !(isSafe && i.startsWith("[ML]")));
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

  const isUrlContent = contentType === "url" || result.pipelineTrace?.inputType === "url";
  const reportedMessage = isUrlContent
    ? result.summary
    : reportedContent || result.summary;
  const reportedUrl = isUrlContent ? reportedContent : undefined;

  const scamWatchDescription = [
    "Detected warning indicators:",
    ...visibleIndicators.map(friendlyIndicatorText),
  ].join("\n");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card
        className={cn(
          "border-2 shadow-soft overflow-hidden",
          styles.card
        )}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "p-3 rounded-full",
                styles.iconWrap
              )}
            >
              {isSafe && <ShieldCheck className="h-8 w-8" />}

              {isSuspicious && (
                <AlertTriangle className="h-8 w-8" />
              )}

              {isHighRisk && (
                <ShieldAlert className="h-8 w-8" />
              )}
            </div>

            <div>
              <CardTitle className="text-2xl">
                {isSafe && "No obvious threat detected"}
                {isSuspicious && "Suspicious"}
                {isHighRisk && "High Risk"}
              </CardTitle>

              <CardDescription className="text-base mt-1 flex items-center gap-2">
                <span className="text-foreground/80 font-medium">
                  Analysis Confidence
                </span>

                <Badge variant="secondary">
                  {result.confidence}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="rounded-lg bg-muted/50 p-4 border border-border/40">
            <p className="text-sm leading-relaxed">
              {result.summary}
            </p>
          </div>

          {showIndicators && visibleIndicators.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2 text-danger" />
                Warning Indicators Detected
              </h4>

              <ul className="space-y-2.5">
                {visibleIndicators.map((indicator: string, idx: number) => {
                  const severity = indicatorSeverity(indicator);
                  const style = severityStyles[severity];

                  return (
                    <li
                      key={idx}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border border-l-4 p-3 text-sm",
                        style.bg,
                        style.border
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 rounded-full shrink-0",
                          style.dot
                        )}
                      />
                      <div className="min-w-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "mb-1 h-5 px-2 text-[10px] font-semibold uppercase tracking-wide",
                            style.badge
                          )}
                        >
                          {style.badgeLabel}
                        </Badge>
                        <p className="leading-relaxed">
                          {friendlyIndicatorText(indicator)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Email Forensics Section (if applicable) */}
          {result.emailAnalysis && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-primary" />
                Email Forensics Analysis
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center">
                    <ShieldCheck className="h-3 w-3 mr-1.5" /> Authentication
                  </h5>
                  <div className="flex justify-between items-center text-sm">
                    <span>SPF</span>
                    <Badge variant={result.emailAnalysis.auth.spf === "pass" ? "secondary" : result.emailAnalysis.auth.spf === "fail" ? "destructive" : "outline"}>
                      {result.emailAnalysis.auth.spf.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>DKIM</span>
                    <Badge variant={result.emailAnalysis.auth.dkim === "pass" ? "secondary" : result.emailAnalysis.auth.dkim === "fail" ? "destructive" : "outline"}>
                      {result.emailAnalysis.auth.dkim.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>DMARC</span>
                    <Badge variant={result.emailAnalysis.auth.dmarc === "pass" ? "secondary" : result.emailAnalysis.auth.dmarc === "fail" ? "destructive" : "outline"}>
                      {result.emailAnalysis.auth.dmarc.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center">
                    <Server className="h-3 w-3 mr-1.5" /> Sender Details
                  </h5>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> Origin</span>
                    <span className="font-medium truncate max-w-[120px]" title={result.emailAnalysis.geoIp.country}>
                      {result.emailAnalysis.geoIp.country || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> Domain Age</span>
                    {result.emailAnalysis.domainAge.isNewDomain ? (
                      <Badge variant="destructive">NEW ({result.emailAnalysis.domainAge.ageDays} days)</Badge>
                    ) : (
                      <span className="font-medium">
                        {result.emailAnalysis.domainAge.ageDays > 0 ? `${result.emailAnalysis.domainAge.ageDays} days` : "Unknown"}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Hops</span>
                    <span className="font-medium">{result.emailAnalysis.relayPath.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 mr-2 text-success" />
              Recommended Actions
            </h4>

            <ul className="space-y-2.5">
              {result.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start text-sm"
                >
                  <span className="mr-2.5 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />

                  <span className="leading-relaxed">
                    {rec}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pipeline Trace (Technical Details) */}
          {result.pipelineTrace && (
            <details className="group [&_summary::-webkit-details-marker]:hidden rounded-lg border bg-muted/20">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-medium text-sm">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                  Technical Analysis Trace
                </div>
                <span className="transition duration-300 group-open:-rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground border-t pt-3">
                <div className="mb-3 flex justify-between items-center">
                  <span className="text-xs uppercase font-semibold">Detected Input Type</span>
                  <Badge variant="outline">{result.pipelineTrace.inputType}</Badge>
                </div>
                <ul className="space-y-3">
                  {result.pipelineTrace.stages.map((stage, idx) => (
                    <li key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize text-foreground">{stage.stage.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          {stage.durationMs !== undefined && (
                            <span className="text-[10px] text-muted-foreground">{stage.durationMs}ms</span>
                          )}
                          <Badge 
                            variant={
                              stage.status === "pass" || stage.status === "clean" ? "secondary" 
                              : stage.status === "flagged" ? "destructive"
                              : "outline"
                            }
                            className="text-[10px] uppercase h-5 px-1.5"
                          >
                            {stage.status}
                          </Badge>
                        </div>
                      </div>
                      {stage.detail && (
                        <span className="text-xs">{stage.detail}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-3 border-t text-xs text-right">
                  Total Processing Time: {result.pipelineTrace.totalDurationMs}ms
                </div>
              </div>
            </details>
          )}

          {/* Community warning */}
          {!isSafe && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>

                <div>
                  <h4 className="font-semibold">
                    Help protect the community
                  </h4>

                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    You found a suspicious threat. Warn the
                    community so others can recognize the same
                    pattern before they fall for it.
                  </p>
                </div>
              </div>

              {/* Pre-filled ScamWatch link */}
              <WarnCommunityButton
                scamType={isHighRisk ? "Potential Scam" : "Suspicious Activity"}
                riskLevel={result.level}
                message={reportedMessage}
                description={scamWatchDescription}
                url={reportedUrl}
                className="mt-4 w-full"
              />

              <p className="mt-2 text-center text-xs text-muted-foreground">
                Your analysis will be used to pre-fill the report.
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2 bg-muted/10 border-t">
          <Button
            onClick={onReset}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Something Else
          </Button>

          {!isSafe && (
            <Link
              href="/report"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full sm:w-auto"
              )}
            >
              Report & Recover
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}