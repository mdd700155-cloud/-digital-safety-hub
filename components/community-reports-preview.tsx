"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Users, Clock, Flame, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScamReport = {
  id: string;
  scam_type: string;
  risk_level: string;
  message: string | null;
  url: string | null;
  description: string | null;
  seen_count: number | null;
  created_at: string | null;
};

function getRiskLabel(risk: string) {
  if (risk === "HIGH_RISK") return "High Risk";
  if (risk === "SUSPICIOUS") return "Suspicious";
  return "Safe";
}

function getRiskBadgeClass(risk: string) {
  if (risk === "HIGH_RISK") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }

  if (risk === "SUSPICIOUS") {
    return "bg-warning/10 text-warning-foreground border-warning/30";
  }

  return "bg-success/10 text-success-foreground border-success/20";
}

function timeAgo(date: string | null) {
  if (!date) return "Recently reported";

  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function snippet(report: ScamReport, maxLength = 160) {
  const text = report.message || report.description || report.url || "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export function CommunityReportsPreview() {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("scam_reports")
      .select(
        "id, scam_type, risk_level, message, url, description, seen_count, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data, error: err }) => {
        if (cancelled) return;

        if (!err && data) {
          setReports(data);
        } else if (err) {
          console.error("Failed to load scam reports:", err);
          setError("Could not load community reports right now.");
        }

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
            <Users className="h-4 w-4" />
            Community Watch
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">
            What are people reporting?
          </h2>
          <p className="mt-2 text-lg text-muted-foreground leading-relaxed">
            Recent scam warnings shared by other users. See the patterns before they reach you.
          </p>
        </div>
        <Link
          href="/scamwatch"
          className={cn(buttonVariants({ variant: "outline" }), "shrink-0 self-start sm:self-auto")}
        >
          View all on ScamWatch
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {loading && (
        <Card className="p-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading community reports...</p>
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card className="p-12">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{error}</h3>
            <Link
              href="/scamwatch"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              Open ScamWatch
            </Link>
          </div>
        </Card>
      )}

      {!loading && !error && reports.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">No scam reports yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first person to warn the community.
            </p>
          </div>
        </Card>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {reports.map((report) => {
            const seenCount = report.seen_count ?? 0;
            const isTrending = seenCount >= 3;

            return (
              <Link
                key={report.id}
                href="/scamwatch"
                className="group block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xl"
              >
                <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lift">
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <Badge className={getRiskBadgeClass(report.risk_level)}>
                        {getRiskLabel(report.risk_level)}
                      </Badge>
                      {isTrending && (
                        <Badge variant="outline" className="gap-1">
                          <Flame className="h-3 w-3 text-warning" />
                          Trending
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-bold leading-snug">
                      {report.scam_type}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                      {snippet(report)}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {timeAgo(report.created_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {seenCount} seen
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}