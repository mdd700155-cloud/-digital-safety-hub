"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Loader2,
  ImagePlus,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "scamwatch_report_persisted_state_v1";
const EVIDENCE_BUCKET = "scam-evidence";
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type EvidenceImage = {
  file: File;
  previewUrl: string;
};

type PersistedReportState = {
  scamType: string;
  riskLevel: string;
  message: string;
  url: string;
  description: string;
};

function loadPersistedReport(): PersistedReportState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedReportState;
    if (typeof parsed === "object" && parsed !== null) {
      return {
        scamType: typeof parsed.scamType === "string" ? parsed.scamType : "",
        riskLevel: ["HIGH_RISK", "SUSPICIOUS", "SAFE"].includes(parsed.riskLevel) ? parsed.riskLevel : "HIGH_RISK",
        message: typeof parsed.message === "string" ? parsed.message : "",
        url: typeof parsed.url === "string" ? parsed.url : "",
        description: typeof parsed.description === "string" ? parsed.description : "",
      };
    }
    return null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

type ReportScamFormProps = {
  onSubmitted: () => void;
};

export default function ReportScamForm({
  onSubmitted,
}: ReportScamFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const persisted = loadPersistedReport();

  const hasUrlParams = Boolean(
    searchParams.get("scamType") ||
      searchParams.get("riskLevel") ||
      searchParams.get("message") ||
      searchParams.get("url") ||
      searchParams.get("description")
  );

  const [scamType, setScamType] = useState<string>(
    () => (hasUrlParams ? searchParams.get("scamType") ?? "" : persisted?.scamType ?? "")
  );
  const [riskLevel, setRiskLevel] = useState<string>(() => {
    if (hasUrlParams) {
      const level = searchParams.get("riskLevel");
      return level === "HIGH_RISK" || level === "SUSPICIOUS" || level === "SAFE" ? level : "HIGH_RISK";
    }
    return persisted?.riskLevel ?? "HIGH_RISK";
  });
  const [message, setMessage] = useState<string>(
    () => (hasUrlParams ? searchParams.get("message") ?? "" : persisted?.message ?? "")
  );
  const [url, setUrl] = useState<string>(
    () => (hasUrlParams ? searchParams.get("url") ?? "" : persisted?.url ?? "")
  );
  const [description, setDescription] = useState<string>(
    () => (hasUrlParams ? searchParams.get("description") ?? "" : persisted?.description ?? "")
  );

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [evidenceImages, setEvidenceImages] = useState<EvidenceImage[]>([]);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    return () => {
      evidenceImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const toSave: PersistedReportState = { scamType, riskLevel, message, url, description };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore
    }
  }, [scamType, riskLevel, message, url, description]);

  const fromScan = Boolean(
    searchParams.get("scamType") ||
      searchParams.get("riskLevel") ||
      searchParams.get("message") ||
      searchParams.get("url") ||
      searchParams.get("description")
  );

  function handleAddImages(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setImageError("");

    const files = Array.from(fileList);
    const remainingSlots = MAX_IMAGES - evidenceImages.length;

    if (remainingSlots <= 0) {
      setImageError(`You can attach up to ${MAX_IMAGES} images.`);
      return;
    }

    const selected = files.slice(0, remainingSlots);

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setImageError("Only image files (JPG, PNG, WebP, etc.) are allowed.");
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setImageError("Each image must be 5 MB or smaller.");
        return;
      }
    }

    setEvidenceImages((current) => [
      ...current,
      ...selected.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeImage(index: number) {
    setEvidenceImages((current) => {
      const target = current[index];

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((_, i) => i !== index);
    });

    setImageError("");
  }

  async function uploadEvidenceImages(): Promise<string[]> {
    const urls: string[] = [];

    for (const image of evidenceImages) {
      const extension = image.file.name.split(".").pop() ?? "jpg";
      const path = `reports/${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .upload(path, image.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          "One or more images failed to upload. Please try again."
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from(EVIDENCE_BUCKET)
        .getPublicUrl(path);

      urls.push(publicUrlData.publicUrl);
    }

    return urls;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSubmitting(true);
    setSuccess(false);
    setError("");

    let imageUrls: string[] = [];

    try {
      if (evidenceImages.length > 0) {
        imageUrls = await uploadEvidenceImages();
      }
    } catch (uploadError) {
      setSubmitting(false);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed. Please try again."
      );
      return;
    }

    const { error } = await supabase
      .from("scam_reports")
      .insert({
        scam_type: scamType,
        risk_level: riskLevel,
        message: message || null,
        url: url || null,
        description: description || null,
        indicators: [],
        image_urls: imageUrls.length > 0 ? imageUrls : null,
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

    evidenceImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setEvidenceImages([]);
    setImageError("");

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }

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

        {/* Evidence Images */}
        <div className="space-y-2">
          <Label htmlFor="evidence-images">Evidence images</Label>

          <div className="flex flex-wrap items-center gap-3">
            {evidenceImages.map((image, index) => (
              <div
                key={image.previewUrl}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
              >
                <img
                  src={image.previewUrl}
                  alt={`Evidence image ${index + 1}`}
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  aria-label={`Remove image ${index + 1}`}
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/85 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {evidenceImages.length < MAX_IMAGES && (
              <label
                htmlFor="evidence-images"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <ImagePlus className="h-4 w-4" />
                Upload image
              </label>
            )}
          </div>

          <input
            id="evidence-images"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              handleAddImages(e.target.files);
              e.target.value = "";
            }}
          />

          <p className="text-xs text-muted-foreground">
            Screenshots of the scam help others recognize it. Up to{" "}
            {MAX_IMAGES} images, 5 MB each.
          </p>

          {imageError && (
            <p
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {imageError}
            </p>
          )}
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