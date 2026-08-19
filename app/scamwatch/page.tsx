"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Users,
  ShieldAlert,
  Clock,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ReportScamForm from "./ReportScamForm";

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

export default function ScamWatchPage() {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const [seenReports, setSeenReports] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    const saved = localStorage.getItem("scamwatch_seen");

    if (!saved) return [];

    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem("scamwatch_seen");
      return [];
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadReports() {
    const { data, error } = await supabase
      .from("scam_reports")
      .select(
        "id, scam_type, risk_level, message, url, description, seen_count, created_at"
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReports(data);
    } else if (error) {
      console.error("Failed to load scam reports:", error);
    }

    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("scam_reports")
      .select(
        "id, scam_type, risk_level, message, url, description, seen_count, created_at"
      )
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;

        if (!error && data) {
          setReports(data);
        } else if (error) {
          console.error("Failed to load scam reports:", error);
        }

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function confirmSeen(report: ScamReport) {
    if (seenReports.includes(report.id)) return;

    const currentCount = report.seen_count ?? 0;

    const { error } = await supabase
      .from("scam_reports")
      .update({
        seen_count: currentCount + 1,
      })
      .eq("id", report.id);

    if (error) {
      console.error("Failed to update seen count:", error);
      return;
    }

    const updatedSeen = [...seenReports, report.id];

    setSeenReports(updatedSeen);

    localStorage.setItem(
      "scamwatch_seen",
      JSON.stringify(updatedSeen)
    );

    setReports((currentReports) =>
      currentReports.map((item) =>
        item.id === report.id
          ? {
              ...item,
              seen_count: currentCount + 1,
            }
          : item
      )
    );
  }

  async function copyText(
    text: string,
    id: string
  ) {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedId(id);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch {
      console.error("Could not copy text.");
    }
  }

  function formatDate(date: string | null) {
    if (!date) return "Recently reported";

    return new Date(date).toLocaleString();
  }

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesRisk =
        riskFilter === "ALL" ||
        report.risk_level === riskFilter;

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        report.scam_type?.toLowerCase().includes(searchText) ||
        report.message?.toLowerCase().includes(searchText) ||
        report.url?.toLowerCase().includes(searchText) ||
        report.description?.toLowerCase().includes(searchText);

      return matchesRisk && matchesSearch;
    });
  }, [reports, search, riskFilter]);

  const highRiskCount = reports.filter(
    (r) => r.risk_level === "HIGH_RISK"
  ).length;

  const suspiciousCount = reports.filter(
    (r) => r.risk_level === "SUSPICIOUS"
  ).length;

  const trendingCount = reports.filter(
    (r) => (r.seen_count ?? 0) >= 3
  ).length;

  return (
    <PageContainer className="py-12 md:py-20">
      {/* HERO */}
      <PageHeader
        align="left"
        badge="Community Protection"
        icon={<ShieldCheck className="h-4 w-4" />}
        title="ScamWatch"
        description="Real scam warnings shared by the community. See what others are encountering and recognize threats before they reach you."
        className="mb-12"
      />

      {/* COMMUNITY STATS */}
      <section className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Community Reports
            </p>

            <Users className="h-5 w-5 text-primary" />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {reports.length}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              High Risk
            </p>

            <ShieldAlert className="h-5 w-5 text-destructive" />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {highRiskCount}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Suspicious
            </p>

            <Clock className="h-5 w-5 text-warning" />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {suspiciousCount}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trending
            </p>

            <Flame className="h-5 w-5 text-warning" />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {trendingCount}
          </p>
        </Card>
      </section>

      {/* REPORT FORM */}
      <section className="mb-16">
        <Suspense fallback={null}>
          <ReportScamForm onSubmitted={loadReports} />
        </Suspense>
      </section>

      {/* COMMUNITY REPORTS */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Community Reports
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Search and explore scam warnings shared by other users.
          </p>
        </div>

        {/* SEARCH + FILTER */}
        <div className="mb-8 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scams, messages, URLs..."
              aria-label="Search scam reports"
              className="h-10 pl-10"
            />
          </div>

          <div className="relative md:w-48">
            <Label htmlFor="risk-filter" className="sr-only">
              Filter by risk level
            </Label>

            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <select
              id="risk-filter"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="ALL">
                All Risk Levels
              </option>

              <option value="HIGH_RISK">
                High Risk
              </option>

              <option value="SUSPICIOUS">
                Suspicious
              </option>

              <option value="SAFE">
                Safe
              </option>
            </select>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <Card className="p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading community reports...
              </p>
            </div>
          </Card>
        )}

        {/* EMPTY */}
        {!loading && filteredReports.length === 0 && (
          <Card className="p-12">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10">
                <ShieldCheck className="h-6 w-6" />
              </span>

              <h3 className="mt-4 text-xl font-semibold">
                {reports.length === 0
                  ? "No scam reports yet"
                  : "No matching reports"}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                {reports.length === 0
                  ? "Be the first person to warn the community."
                  : "Try a different search or risk filter."}
              </p>
            </div>
          </Card>
        )}

        {/* REPORT CARDS */}
        {!loading && filteredReports.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredReports.map((report) => {
              const alreadySeen =
                seenReports.includes(report.id);

              const seenCount =
                report.seen_count ?? 0;

              const isTrending =
                seenCount >= 3;

              return (
                <Card
                  key={report.id}
                  className="transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <CardHeader className="flex-row items-center justify-between gap-3 border-b">
                    <Badge
                      className={getRiskBadgeClass(
                        report.risk_level
                      )}
                    >
                      {getRiskLabel(
                        report.risk_level
                      )}
                    </Badge>

                    {isTrending && (
                      <Badge variant="outline" className="gap-1">
                        <Flame className="h-3 w-3 text-warning" />
                        Trending
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* TITLE */}
                    <div>
                      <h3 className="text-xl font-bold">
                        {report.scam_type}
                      </h3>

                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Reported{" "}
                        {formatDate(
                          report.created_at
                        )}
                      </p>
                    </div>

                    {/* MESSAGE */}
                    {report.message && (
                      <div className="rounded-xl bg-muted/50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          Suspicious message
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {report.message}
                        </p>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyText(
                              report.message!,
                              `message-${report.id}`
                            )
                          }
                          className="mt-4"
                        >
                          {copiedId ===
                          `message-${report.id}` ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy Message
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* URL */}
                    {report.url && (
                      <div className="rounded-xl border p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          Suspicious URL
                        </p>

                        <p className="break-all rounded-lg bg-muted/50 p-3 text-sm">
                          {report.url}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyText(
                                report.url!,
                                `url-${report.id}`
                              )
                            }
                          >
                            {copiedId ===
                            `url-${report.id}` ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                Copy URL
                              </>
                            )}
                          </Button>

                          <a
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "sm",
                              })
                            )}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open URL
                          </a>
                        </div>

                        <p className="mt-3 flex items-start gap-1.5 text-xs text-destructive">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          Do not open a suspicious URL unless you know it is safe.
                        </p>
                      </div>
                    )}

                    {/* WHAT HAPPENED */}
                    {report.description && (
                      <div className="rounded-xl border p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          What happened?
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {report.description}
                        </p>
                      </div>
                    )}

                    {/* COMMUNITY SIGNAL */}
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-semibold">
                            <Users className="h-4 w-4" />
                            Community signal
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Seen by{" "}
                            <strong className="text-foreground">
                              {seenCount}
                            </strong>{" "}
                            {seenCount === 1
                              ? "person"
                              : "people"}
                          </p>
                        </div>

                        {isTrending && (
                          <Flame className="h-6 w-6 text-warning" />
                        )}
                      </div>

                      <Button
                        type="button"
                        variant={alreadySeen ? "secondary" : "outline"}
                        className="mt-4 w-full"
                        onClick={() => confirmSeen(report)}
                        disabled={alreadySeen}
                      >
                        {alreadySeen ? (
                          <>
                            <Check className="h-4 w-4" />
                            You&apos;ve Seen This
                          </>
                        ) : (
                          "I've Seen This Too"
                        )}
                      </Button>
                    </div>

                    {/* SAFETY WARNING */}
                    {report.risk_level ===
                      "HIGH_RISK" && (
                      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
                        <strong className="flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" />
                          Stay safe:
                        </strong>{" "}
                        Do not click suspicious links,
                        share OTPs, passwords or PINs,
                        or send money because of this
                        message.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </PageContainer>
  );
}