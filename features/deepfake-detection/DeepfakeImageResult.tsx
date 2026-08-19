import { DeepfakeImageAnalysisResult } from "@/types/deepfakeImageAnalysis";
import { AlertTriangle, CheckCircle, HelpCircle, FileImage, Info } from "lucide-react";
import { WarnCommunityButton } from "@/components/warn-community-button";

interface DeepfakeImageResultProps {
  result: DeepfakeImageAnalysisResult;
}

export function DeepfakeImageResult({ result }: DeepfakeImageResultProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "LIKELY_SYNTHETIC":
        return "text-danger";
      case "UNCERTAIN":
        return "text-warning";
      case "LIKELY_AUTHENTIC":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case "LIKELY_SYNTHETIC":
        return "bg-danger/10 border-danger/30";
      case "UNCERTAIN":
        return "bg-warning/10 border-warning/30";
      case "LIKELY_AUTHENTIC":
        return "bg-success/10 border-success/30";
      default:
        return "bg-muted/30 border-border";
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case "LIKELY_SYNTHETIC":
        return <AlertTriangle className="h-8 w-8 text-danger" />;
      case "UNCERTAIN":
        return <HelpCircle className="h-8 w-8 text-warning" />;
      case "LIKELY_AUTHENTIC":
        return <CheckCircle className="h-8 w-8 text-success" />;
      default:
        return <Info className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const isSynthetic = result.riskLevel === "LIKELY_SYNTHETIC";
  const isUncertain = result.riskLevel === "UNCERTAIN";

  const warnDescription = [
    `AI image deepfake analysis — ${result.probability}% synthetic probability.`,
    "Key findings:",
    ...result.featureScores.slice(0, 4).map(
      (f) => `- ${f.name}: ${f.score}/100 — ${f.explanation}`
    ),
  ].join("\n");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overview Card */}
      <div className={`p-6 rounded-xl border-2 shadow-soft ${getRiskBg(result.riskLevel)}`}>
        <div className="flex items-center gap-4 mb-4">
          {getIcon(result.riskLevel)}
          <div>
            <h3 className={`text-xl font-semibold ${getRiskColor(result.riskLevel)}`}>
              {result.riskLevel.replace("_", " ")}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              {result.probability}% Synthetic Probability
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed">{result.summary}</p>

        {result.metadata.processingStatus === "AI_UNAVAILABLE" && (
          <div
            role="alert"
            className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning-foreground"
          >
            <Info className="h-4 w-4 inline-block mr-1 mb-0.5" />
            AI analysis unavailable (Missing API Key). Result is based entirely on client-side CS-LBP and Laplacian variance forensics.
          </div>
        )}
      </div>

      {/* Gemini AI Reasoning (if available) */}
      {result.geminiAssessment && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            AI Forensic Analysis
          </h4>
          <div className="p-4 bg-secondary/50 rounded-xl text-sm space-y-3">
            <p>{result.geminiAssessment.reasoning}</p>
            {result.geminiAssessment.observations.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {result.geminiAssessment.observations.map((obs, i) => (
                  <li key={i}>{obs}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Client-Side Features Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Image Signal Forensics</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.featureScores.map((feature, i) => (
            <div key={i} className="p-3 bg-secondary/30 rounded-xl border border-border/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium">{feature.name}</span>
                <span className={`text-xs font-bold ${feature.score > 50 ? "text-danger" : "text-success"}`}>
                  {feature.score}/100
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5 mb-2">
                <div
                  className={`h-1.5 rounded-full ${feature.score > 50 ? "bg-danger" : "bg-success"}`}
                  style={{ width: `${feature.score}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {feature.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Recommendations</h4>
        <ul className="space-y-2">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[10px] text-muted-foreground text-center italic mt-4">
        {result.disclaimer}
      </p>

      {!isSynthetic && !isUncertain ? null : (
        <WarnCommunityButton
          scamType={isSynthetic ? "AI-Generated / Deepfake Image Scam" : "Suspicious Image"}
          riskLevel={isSynthetic ? "HIGH_RISK" : "SUSPICIOUS"}
          message={result.summary}
          description={warnDescription}
          className="w-full"
        />
      )}
    </div>
  );
}
