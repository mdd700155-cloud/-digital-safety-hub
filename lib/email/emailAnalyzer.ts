/**
 * Email Analyzer — Orchestrator for Email Forensic Modules
 *
 * Coordinates all five email forensic modules:
 *   1. Header Parser
 *   2. SPF/DKIM/DMARC Authentication Checker
 *   3. Sender IP Geolocation
 *   4. Domain Age (RDAP)
 *   5. SMTP Relay Path
 *
 * Called by the main orchestrator when input type is "email".
 * Runs header parsing first (synchronous), then all external lookups
 * concurrently. Converts forensic findings into weighted signals
 * compatible with the Risk Aggregator.
 */

import { parseEmailHeaders } from "./headerParser";
import { checkEmailAuth } from "./authChecker";
import { lookupGeoIp } from "./geoIp";
import { checkDomainAge } from "./domainAge";
import { buildRelayPath } from "./relayPath";
import { EmailAnalysisResult } from "@/types/emailAnalysis";
import { UrlSignal } from "@/lib/security/urlAnalyzer";

export interface EmailAnalyzerOutput {
  analysis: EmailAnalysisResult;
  /** Plain-text signals for display / Gemini prompt */
  signals: string[];
  /** Weighted signals for the Risk Aggregator */
  weightedSignals: UrlSignal[];
  /** URLs extracted from the email body for further analysis */
  extractedUrls: string[];
}

/**
 * Extract URLs from email body text.
 */
function extractUrlsFromBody(rawEmail: string): string[] {
  // Split at the first blank line to get the body
  const parts = rawEmail.split(/\r?\n\r?\n/);
  if (parts.length < 2) return [];
  const body = parts.slice(1).join("\n\n");

  const urlRegex = /(https?:\/\/[^\s<>"]+)|(www\.[^\s<>"]+)/gi;
  const matches = body.match(urlRegex);
  if (!matches) return [];

  return matches
    .map((u) => (u.startsWith("www.") ? "http://" + u : u))
    .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
}

/**
 * Analyze raw email content through all forensic modules.
 */
export async function analyzeEmail(rawEmail: string): Promise<EmailAnalyzerOutput> {
  const signals: string[] = [];
  const weightedSignals: UrlSignal[] = [];

  // ── Step 1: Parse headers (synchronous) ────────────────────────────
  const headers = parseEmailHeaders(rawEmail);

  // Check for Return-Path / From mismatch (spoofing indicator)
  if (headers.returnPath && headers.from) {
    const returnPathDomain = extractDomainFrom(headers.returnPath);
    const fromDomain = extractDomainFrom(headers.from);
    if (returnPathDomain && fromDomain && returnPathDomain !== fromDomain) {
      signals.push(`Return-Path domain (${returnPathDomain}) does not match From domain (${fromDomain})`);
      weightedSignals.push({
        message: `Return-Path domain (${returnPathDomain}) does not match From domain (${fromDomain}) — possible spoofing`,
        weight: "MODERATE",
      });
    }
  }

  // ── Step 2: Run external lookups concurrently ──────────────────────
  const [authResult, geoIpResult, domainAgeResult] = await Promise.allSettled([
    checkEmailAuth(headers.sendingDomain, headers.authenticationResults),
    headers.originatingIp ? lookupGeoIp(headers.originatingIp) : Promise.resolve({
      ip: "", lat: 0, lon: 0, city: "", country: "", countryCode: "", isp: "", available: false,
    }),
    headers.sendingDomain ? checkDomainAge(headers.sendingDomain) : Promise.resolve({
      domain: "", registrationDate: "", ageDays: -1, isNewDomain: false, available: false,
    }),
  ]);

  // ── Process auth results ───────────────────────────────────────────
  const auth = authResult.status === "fulfilled"
    ? authResult.value
    : { spf: "error" as const, spfRecord: "", dkim: "error" as const, dkimRecord: "", dmarc: "error" as const, dmarcRecord: "", fromHeader: false };

  if (auth.spf === "fail") {
    signals.push("SPF check: FAIL — sender not authorized by domain's SPF record");
    weightedSignals.push({ message: "SPF authentication failed", weight: "MODERATE" });
  } else if (auth.spf === "none") {
    signals.push("SPF check: NONE — no SPF record found for sending domain");
    weightedSignals.push({ message: "No SPF record found for sending domain", weight: "WEAK" });
  } else if (auth.spf === "pass") {
    signals.push("SPF check: PASS");
  }

  if (auth.dkim === "fail") {
    signals.push("DKIM check: FAIL — DKIM signature verification failed");
    weightedSignals.push({ message: "DKIM authentication failed", weight: "MODERATE" });
  } else if (auth.dkim === "none") {
    signals.push("DKIM check: NONE — no DKIM verification available");
  } else if (auth.dkim === "pass") {
    signals.push("DKIM check: PASS");
  }

  if (auth.dmarc === "fail") {
    signals.push("DMARC check: FAIL — domain's DMARC policy violated");
    weightedSignals.push({ message: "DMARC policy violated", weight: "MODERATE" });
  } else if (auth.dmarc === "none") {
    signals.push("DMARC check: NONE — no DMARC record found");
    weightedSignals.push({ message: "No DMARC record found for sending domain", weight: "WEAK" });
  } else if (auth.dmarc === "pass") {
    signals.push("DMARC check: PASS");
  }

  // ── Process geo-IP results ─────────────────────────────────────────
  const geoIp = geoIpResult.status === "fulfilled"
    ? geoIpResult.value
    : { ip: headers.originatingIp, lat: 0, lon: 0, city: "", country: "", countryCode: "", isp: "", available: false };

  if (geoIp.available && geoIp.country) {
    signals.push(`Originating IP: ${geoIp.ip} (${geoIp.city}, ${geoIp.country} — ISP: ${geoIp.isp})`);
  }

  // ── Process domain age results ─────────────────────────────────────
  const domainAge = domainAgeResult.status === "fulfilled"
    ? domainAgeResult.value
    : { domain: headers.sendingDomain, registrationDate: "", ageDays: -1, isNewDomain: false, available: false };

  if (domainAge.available) {
    if (domainAge.isNewDomain) {
      signals.push(`Sending domain registered ${domainAge.ageDays} day(s) ago — newly registered domain`);
      weightedSignals.push({
        message: `Sending domain "${domainAge.domain}" registered only ${domainAge.ageDays} day(s) ago`,
        weight: "STRONG",
      });
    } else if (domainAge.ageDays >= 0) {
      signals.push(`Sending domain age: ${domainAge.ageDays} days (registered ${domainAge.registrationDate})`);
    }
  }

  // ── Build relay path ───────────────────────────────────────────────
  const relayPath = buildRelayPath(headers.receivedChain);

  if (relayPath.length > 0) {
    signals.push(`Email traversed ${relayPath.length} relay hop(s)`);
  }

  // ── Extract URLs from email body ───────────────────────────────────
  const extractedUrls = extractUrlsFromBody(rawEmail);
  if (extractedUrls.length > 0) {
    signals.push(`Found ${extractedUrls.length} URL(s) in email body`);
  }

  return {
    analysis: {
      headers,
      auth,
      geoIp,
      domainAge,
      relayPath,
    },
    signals,
    weightedSignals,
    extractedUrls,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

function extractDomainFrom(headerValue: string): string {
  const cleaned = headerValue.replace(/.*</, "").replace(/>.*/, "").trim();
  const atIndex = cleaned.lastIndexOf("@");
  if (atIndex === -1) return "";
  return cleaned.substring(atIndex + 1).toLowerCase();
}
