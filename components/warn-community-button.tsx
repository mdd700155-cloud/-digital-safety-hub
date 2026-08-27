"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WarnCommunityButtonProps {
  scamType: string;
  riskLevel: string;
  message?: string;
  description?: string;
  url?: string;
  emlFileName?: string;
  emlRaw?: string;
  className?: string;
}

const SCAMWATCH_EML_PENDING = "scamwatch_eml_pending";

export function WarnCommunityButton({
  scamType,
  riskLevel,
  message,
  description,
  url,
  emlFileName,
  emlRaw,
  className,
}: WarnCommunityButtonProps) {
  const params = new URLSearchParams({
    scamType,
    riskLevel,
  });

  if (message) params.set("message", message);
  if (description) params.set("description", description);
  if (url) params.set("url", url);
  if (emlFileName) params.set("emlName", emlFileName);

  const handleClick = () => {
    try {
      if (emlRaw && emlFileName) {
        // Store raw .eml in localStorage to avoid URL length limits (max ~80k chars)
        const rawSlice = emlRaw.slice(0, 80000);
        localStorage.setItem(
          SCAMWATCH_EML_PENDING,
          JSON.stringify({ name: emlFileName, raw: rawSlice, at: Date.now() })
        );
      } else {
        // Clear stale pending if no eml on this report
        localStorage.removeItem(SCAMWATCH_EML_PENDING);
      }
    } catch {
      // ignore quota
    }
  };

  return (
    <Link
      href={`/scamwatch?${params.toString()}`}
      onClick={handleClick}
      className={cn(buttonVariants({ variant: "default" }), className)}
    >
      <Users className="mr-2 h-4 w-4" />
      Warn the Community
      <ArrowRight className="ml-auto h-4 w-4" />
    </Link>
  );
}