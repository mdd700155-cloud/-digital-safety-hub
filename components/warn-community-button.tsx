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
  className?: string;
}

export function WarnCommunityButton({
  scamType,
  riskLevel,
  message,
  description,
  url,
  className,
}: WarnCommunityButtonProps) {
  const params = new URLSearchParams({
    scamType,
    riskLevel,
  });

  if (message) params.set("message", message);
  if (description) params.set("description", description);
  if (url) params.set("url", url);

  return (
    <Link
      href={`/scamwatch?${params.toString()}`}
      className={cn(buttonVariants({ variant: "default" }), className)}
    >
      <Users className="mr-2 h-4 w-4" />
      Warn the Community
      <ArrowRight className="ml-auto h-4 w-4" />
    </Link>
  );
}