"use client";

import { AlertTriangle, CheckCircle, ShieldAlert, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ResultDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultDisplay({ result, onReset }: ResultDisplayProps) {
  const isSafe = result.level === "SAFE";
  const isSuspicious = result.level === "SUSPICIOUS";
  const isHighRisk = result.level === "HIGH_RISK";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className={`border-2 ${
        isSafe ? "border-green-500/50 dark:border-green-500/30" : 
        isSuspicious ? "border-yellow-500/50 dark:border-yellow-500/30" : 
        "border-red-500/50 dark:border-red-500/30"
      }`}>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              isSafe ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              isSuspicious ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
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
              <CardDescription className="text-base mt-1 text-foreground/80 font-medium">
                Analysis Confidence: {result.confidence}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm">{result.summary}</p>
          </div>

          {!isSafe && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Warning Indicators Detected
              </h4>
              <ul className="space-y-2">
                {result.warningIndicators.map((indicator: string, idx: number) => (
                  <li key={idx} className="flex items-start text-sm">
                    <span className="mr-2 mt-0.5 w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-3 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Recommended Actions
            </h4>
            <ul className="space-y-2">
              {result.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start text-sm">
                  <span className="mr-2 mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>{rec}</span>
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
            <Link href="/report" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 w-full sm:w-auto">
              Report & Recover <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </CardFooter>
      </Card>
      
      <p className="text-xs text-center text-muted-foreground">
        Note: This is an automated frontend analysis. Always use your best judgment.
      </p>
    </div>
  );
}
