"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
    <div className="rounded-2xl border p-6 shadow-sm">
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
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              ✨ From Scam Check
            </span>
          )}
        </div>

        {fromScan && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold">
              🛡️ Analysis imported
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
        <div>
          <label className="mb-2 block text-sm font-medium">
            Scam type
          </label>

          <input
            value={scamType}
            onChange={(e) => setScamType(e.target.value)}
            placeholder="e.g. Fake KYC / Phishing"
            required
            className="w-full rounded-lg border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Risk Level */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Risk level
          </label>

          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="w-full rounded-lg border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="HIGH_RISK">High Risk</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="SAFE">Safe</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Scam message
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste the suspicious message..."
            rows={5}
            className="w-full rounded-lg border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* URL */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Suspicious URL
          </label>

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            What happened?
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe what happened..."
            rows={4}
            className="w-full rounded-lg border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !scamType.trim()}
          className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Publishing..."
            : "🛡️ Publish Scam Warning"}
        </button>

        {/* Success */}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
            ✅ Scam warning published successfully. You just helped
            protect the community!
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            ❌ {error}
          </div>
        )}
      </form>
    </div>
  );
}