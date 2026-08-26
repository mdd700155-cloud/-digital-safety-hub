/**
 * Email Forensics — Type Definitions
 *
 * Covers all five forensic modules:
 *   1. Header parser
 *   2. SPF/DKIM/DMARC auth checker
 *   3. Sender IP geolocation
 *   4. Domain age (RDAP)
 *   5. SMTP relay path
 */

// ── Header Parser ────────────────────────────────────────────────────────

export interface ParsedEmailHeaders {
  from: string;
  returnPath: string;
  replyTo: string;
  subject: string;
  date: string;
  messageId: string;
  receivedChain: ReceivedHeader[];
  /** The raw Authentication-Results header if present */
  authenticationResults: string;
  /** The sending domain extracted from Return-Path or From */
  sendingDomain: string;
  /** The originating IP extracted from the outermost Received header */
  originatingIp: string;
}

export interface ReceivedHeader {
  raw: string;
  from: string;
  by: string;
  ip: string;
  timestamp: string;
}

// ── SPF / DKIM / DMARC ──────────────────────────────────────────────────

export type AuthStatus = "pass" | "fail" | "none" | "error";

export interface AuthCheckResult {
  spf: AuthStatus;
  spfRecord: string;
  dkim: AuthStatus;
  dkimRecord: string;
  dmarc: AuthStatus;
  dmarcRecord: string;
  /** Whether the Authentication-Results header was used as a fallback */
  fromHeader: boolean;
}

// ── Geo-IP ───────────────────────────────────────────────────────────────

export interface GeoIpResult {
  ip: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  countryCode: string;
  isp: string;
  available: boolean;
}

// ── Domain Age (RDAP) ────────────────────────────────────────────────────

export interface DomainAgeResult {
  domain: string;
  registrationDate: string;
  ageDays: number;
  isNewDomain: boolean;
  available: boolean;
}

// ── SMTP Relay Path ──────────────────────────────────────────────────────

export interface RelayHop {
  hop: number;
  from: string;
  by: string;
  ip: string;
  timestamp: string;
}

// ── Combined Email Analysis Result ───────────────────────────────────────

export interface EmailAnalysisResult {
  headers: ParsedEmailHeaders;
  auth: AuthCheckResult;
  geoIp: GeoIpResult;
  domainAge: DomainAgeResult;
  relayPath: RelayHop[];
}
