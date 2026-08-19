"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ReportScamFormProps = {
  onSubmitted: () => void;
};

export default function ReportScamForm({
  onSubmitted,
}: ReportScamFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [scamType, setScamType] = useState(
    () => searchParams.get("scamType") ?? ""
  );
  const [riskLevel, setRiskLevel] = useState(() => {
    const level = searchParams.get("riskLevel");
    return level === "HIGH_RISK" ||
      level === "SUSPICIOUS" ||
      level === "SAFE"
      ? level
      : "HIGH_RISK";
  });
  const [message, setMessage] = useState(
    () => searchParams.get("message") ?? ""
  );
  const [url, setUrl] = useState(
    () => searchParams.get("url") ?? ""
  );
  const [description, setDescription] = useState(
    () => searchParams.get("description") ?? ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const fromScan = Boolean(
    searchParams.get("scamType") ||
      searchParams.get("riskLevel") ||
      searchParams.get("message") ||
      searchParams.get("url") ||
      searchParams.get("description")
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSubmitting(true);
    setSuccess(false);
    setError("");

    const { error } = await supabase
      .from("scam_reports")
      .insert({
        scam_type: scamType,
        risk_level: riskLevel,
        message: message || null,
        url: url || null,
        description: description || null,
        indicators: [],
      });

    setSubmitting(false);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setSuccess(true);

    onSubmitted();

    setScamType("");
    setRiskLevel("HIGH_RISK");
    setMessage("");
    setUrl("");
    setDescription("");

    // Remove the pre-filled URL parameters after successful submission
    router.replace("/scamwatch");
  }

  return (
    <Card className="p-6 shadow-soft">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">
              Warn the Community
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Share a suspicious message or link so others can
              recognize it.
            </p>
          </div>

          {fromScan && (
            <Badge className="shrink-0 gap-1 border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
              From Scam Check
            </Badge>
          )}
        </div>

        {fromScan && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Analysis imported
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              We pre-filled this report using the analysis you just
              completed. Review it before publishing.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Scam Type */}
        <div className="space-y-2">
          <Label htmlFor="scam-type">Scam type</Label>

          <Input
            id="scam-type"
            value={scamType}
            onChange={(e) => setScamType(e.target.value)}
            placeholder="e.g. Fake KYC / Phishing"
            required
          />
        </div>

        {/* Risk Level */}
        <div className="space-y-2">
          <Label htmlFor="risk-level">Risk level</Label>

          <select
            id="risk-level"
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="HIGH_RISK">High Risk</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="SAFE">Safe</option>
          </select>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="scam-message">Scam message</Label>

          <Textarea
            id="scam-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste the suspicious message..."
            rows={5}
          />
        </div>

        {/* URL */}
        <div className="space-y-2">
          <Label htmlFor="suspicious-url">Suspicious URL</Label>

          <Input
            id="suspicious-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">What happened?</Label>

          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe what happened..."
            rows={4}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={submitting || !scamType.trim()}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <ShieldAlert className="h-4 w-4" />
              Publish Scam Warning
            </>
          )}
        </Button>

        {/* Success */}
        {success && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-medium text-success-foreground"
          >
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Scam warning published successfully. You just helped
            protect the community!
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </form>
    </Card>
  );
}