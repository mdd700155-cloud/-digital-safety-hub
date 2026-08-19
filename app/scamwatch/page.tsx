"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
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

export default function ScamWatchPage() {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const [seenReports, setSeenReports] = useState<string[]>([]);
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
    loadReports();

    const saved = localStorage.getItem("scamwatch_seen");

    if (saved) {
      try {
        setSeenReports(JSON.parse(saved));
      } catch {
        localStorage.removeItem("scamwatch_seen");
      }
    }
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

  function getRiskLabel(risk: string) {
    if (risk === "HIGH_RISK") return "HIGH RISK";
    if (risk === "SUSPICIOUS") return "SUSPICIOUS";
    return "SAFE";
  }

  function getRiskClasses(risk: string) {
    if (risk === "HIGH_RISK") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (risk === "SUSPICIOUS") {
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    }

    return "border-green-200 bg-green-50 text-green-700";
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
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">

        {/* HERO */}
        <section className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm font-medium">
            🛡️ Community Protection
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            ScamWatch
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Real scam warnings shared by the community.
            See what others are encountering and recognize
            threats before they reach you.
          </p>
        </section>

        {/* COMMUNITY STATS */}
        <section className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Community Reports
              </p>

              <Users className="h-5 w-5 text-primary" />
            </div>

            <p className="mt-3 text-3xl font-bold">
              {reports.length}
            </p>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                High Risk
              </p>

              <ShieldAlert className="h-5 w-5 text-red-500" />
            </div>

            <p className="mt-3 text-3xl font-bold">
              {highRiskCount}
            </p>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Suspicious
              </p>

              <Clock className="h-5 w-5 text-yellow-500" />
            </div>

            <p className="mt-3 text-3xl font-bold">
              {suspiciousCount}
            </p>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Trending
              </p>

              <Flame className="h-5 w-5 text-orange-500" />
            </div>

            <p className="mt-3 text-3xl font-bold">
              {trendingCount}
            </p>
          </div>

        </section>

        {/* REPORT FORM */}
        <section className="mb-16">
          <ReportScamForm onSubmitted={loadReports} />
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

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search scams, messages, URLs..."
                className="w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <select
                value={riskFilter}
                onChange={(e) =>
                  setRiskFilter(e.target.value)
                }
                className="w-full rounded-xl border bg-background py-3 pl-10 pr-8 text-sm outline-none md:w-48"
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
            <div className="rounded-2xl border p-12 text-center">
              <p className="text-muted-foreground">
                Loading community reports...
              </p>
            </div>
          )}

          {/* EMPTY */}
          {!loading && filteredReports.length === 0 && (
            <div className="rounded-2xl border p-12 text-center">

              <div className="text-4xl">
                🛡️
              </div>

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
                  <article
                    key={report.id}
                    className="overflow-hidden rounded-2xl border bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >

                    {/* TOP */}
                    <div className="flex items-center justify-between gap-3 border-b px-6 py-4">

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${getRiskClasses(
                          report.risk_level
                        )}`}
                      >
                        {getRiskLabel(
                          report.risk_level
                        )}
                      </span>

                      {isTrending && (
                        <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold">
                          <Flame className="h-3.5 w-3.5" />
                          Trending
                        </span>
                      )}

                    </div>

                    <div className="p-6">

                      {/* TITLE */}
                      <h3 className="text-xl font-bold">
                        {report.scam_type}
                      </h3>

                      {/* DATE */}
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Reported{" "}
                        {formatDate(
                          report.created_at
                        )}
                      </p>

                      {/* MESSAGE */}
                      {report.message && (
                        <div className="mt-5 rounded-xl bg-muted/50 p-4">

                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Suspicious message
                          </p>

                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {report.message}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                report.message!,
                                `message-${report.id}`
                              )
                            }
                            className="mt-4 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted"
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
                          </button>

                        </div>
                      )}

                      {/* URL */}
                      {report.url && (
                        <div className="mt-4 rounded-xl border p-4">

                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Suspicious URL
                          </p>

                          <p className="break-all rounded-lg bg-muted/50 p-3 text-sm">
                            {report.url}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  report.url!,
                                  `url-${report.id}`
                                )
                              }
                              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-muted"
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
                            </button>

                            <a
                              href={report.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-muted"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open URL
                            </a>

                          </div>

                          <p className="mt-3 text-xs text-red-600">
                            ⚠️ Do not open a suspicious URL unless you know it is safe.
                          </p>

                        </div>
                      )}

                      {/* WHAT HAPPENED */}
                      {report.description && (
                        <div className="mt-4 rounded-xl border p-4">

                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            What happened?
                          </p>

                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {report.description}
                          </p>

                        </div>
                      )}

                      {/* COMMUNITY SIGNAL */}
                      <div className="mt-5 rounded-xl border p-4">

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
                            <Flame className="h-6 w-6 text-orange-500" />
                          )}

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            confirmSeen(report)
                          }
                          disabled={alreadySeen}
                          className="mt-4 w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {alreadySeen
                            ? "✓ You've Seen This"
                            : "I've Seen This Too"}
                        </button>

                      </div>

                      {/* SAFETY WARNING */}
                      {report.risk_level ===
                        "HIGH_RISK" && (
                        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
                          <strong>
                            ⚠️ Stay safe:
                          </strong>{" "}
                          Do not click suspicious links,
                          share OTPs, passwords or PINs,
                          or send money because of this
                          message.
                        </div>
                      )}

                    </div>
                  </article>
                );
              })}

            </div>
          )}

        </section>
      </div>
    </main>
  );
}