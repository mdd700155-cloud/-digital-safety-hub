/**
 * URL Security Analyzer — Deterministic Heuristic Engine
 *
 * Signal Weighting Philosophy:
 *   STRONG (score 3): Near-certain malicious indicators (userinfo tricks, malformed, confirmed impersonation)
 *   MODERATE (score 2): Meaningful suspicious patterns that warrant attention
 *   WEAK (score 1): Common patterns also found in legitimate URLs; only contextually relevant
 *
 * A single weak signal alone must NEVER produce a SUSPICIOUS or HIGH_RISK result.
 * The aggregator uses the weighted score to make the final determination.
 */

export interface UrlSignal {
  message: string;
  weight: "WEAK" | "MODERATE" | "STRONG";
}

export interface UrlSignalResult {
  isMalformed: boolean;
  normalizedUrl: string | null;
  hostname: string | null;
  registrableDomain: string | null;
  signals: UrlSignal[];
  /** Convenience: simple string list for Gemini prompt */
  signalMessages: string[];
}

// A small, maintainable list of well-known brand domains.
// Only used for impersonation detection — never as standalone evidence.
// Key: brand token | Value: legitimate registrable domains for that brand
const KNOWN_BRAND_DOMAINS: Record<string, string[]> = {
  paypal: ["paypal.com", "paypal.co.uk", "paypal.in"],
  apple: ["apple.com"],
  google: ["google.com", "google.co.in", "googleapis.com", "goo.gl"],
  amazon: ["amazon.com", "amazon.in", "amazon.co.uk", "amzn.to"],
  microsoft: ["microsoft.com", "microsoftonline.com", "live.com", "outlook.com"],
  netflix: ["netflix.com"],
  facebook: ["facebook.com", "fb.com", "fbcdn.net"],
  instagram: ["instagram.com"],
  whatsapp: ["whatsapp.com", "whatsapp.net"],
  hdfc: ["hdfcbank.com", "hdfc.com"],
  sbi: ["sbi.co.in", "onlinesbi.sbi"],
  icici: ["icicibank.com"],
  axis: ["axisbank.com"],
  indusind: ["indusind.com"],
};

/**
 * Extract the registrable domain (eTLD+1) from a hostname.
 * Simple implementation: last two dot-separated parts (e.g. sub.example.com → example.com).
 * For .co.in / .co.uk style TLDs this won't be perfect, but is good enough for impersonation checks.
 */
function getRegistrableDomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length < 2) return hostname;
  // Handle common two-part TLDs: co.in, co.uk, com.au, net.in, org.in
  const twoPartTld = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  const knownTwoPartTlds = ["co.in", "co.uk", "com.au", "net.in", "org.in", "gov.in", "ac.in"];
  if (knownTwoPartTlds.includes(twoPartTld) && parts.length >= 3) {
    return `${parts[parts.length - 3]}.${twoPartTld}`;
  }
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
}

export function analyzeUrl(rawUrl: string): UrlSignalResult {
  const result: UrlSignalResult = {
    isMalformed: false,
    normalizedUrl: null,
    hostname: null,
    registrableDomain: null,
    signals: [],
    signalMessages: [],
  };

  const addSignal = (message: string, weight: UrlSignal["weight"]) => {
    result.signals.push({ message, weight });
    result.signalMessages.push(`[${weight}] ${message}`);
  };

  let url: URL;
  let missingProtocol = false;

  try {
    let parseUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(parseUrl)) {
      // Accept bare domains — add http to parse, but note it
      if (parseUrl.startsWith("//")) {
        parseUrl = "http:" + parseUrl;
      } else {
        parseUrl = "http://" + parseUrl;
      }
      missingProtocol = true;
    }
    url = new URL(parseUrl);
    result.normalizedUrl = url.toString();
    result.hostname = url.hostname;
    result.registrableDomain = getRegistrableDomain(url.hostname);
  } catch {
    result.isMalformed = true;
    result.signals.push({ message: "Malformed URL — could not be parsed", weight: "STRONG" });
    result.signalMessages.push("[STRONG] Malformed URL — could not be parsed");
    return result;
  }

  // ── PROTOCOL ───────────────────────────────────────────────────────
  if (missingProtocol) {
    // Only a weak signal — many people paste URLs without the scheme
    addSignal("URL submitted without a protocol scheme", "WEAK");
  } else if (url.protocol === "http:") {
    // HTTP alone is very common for many legitimate sites; only weakly suspicious
    addSignal("Uses unencrypted HTTP (not HTTPS)", "WEAK");
  }

  // ── IP ADDRESS ──────────────────────────────────────────────────────
  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipv4Regex.test(url.hostname)) {
    // IP-based URLs used to deliver payloads are strongly suspicious in context;
    // on their own still only MODERATE because development tools use IPs legitimately
    addSignal("Uses raw IP address instead of a domain name", "MODERATE");
  }

  // ── USERINFO (user:password@host) ───────────────────────────────────
  if (url.username || url.password) {
    // This is a classic phishing trick to make the real host look like a path
    addSignal("Contains embedded user credentials (user:pass@host) — classic deception technique", "STRONG");
  }

  // ── PUNYCODE / HOMOGRAPH ────────────────────────────────────────────
  if (url.hostname.includes("xn--")) {
    addSignal("Hostname uses Punycode encoding — possible homograph attack", "MODERATE");
  }

  // ── @ IN PATH/QUERY (without username set) ──────────────────────────
  if (rawUrl.includes("@") && !url.username && !url.password) {
    addSignal("Contains '@' delimiter outside of credentials field — deceptive URL structure", "MODERATE");
  }

  // ── LENGTH / DEPTH ──────────────────────────────────────────────────
  // Legitimate CDN/share URLs can be very long; flag only extreme cases
  if (url.hostname.length > 80) {
    addSignal("Unusually long hostname", "WEAK");
  }
  if (rawUrl.length > 250) {
    // Very common in legitimate links; only flag extreme lengths
    addSignal("Extremely long URL", "WEAK");
  }
  const pathDepth = url.pathname.split("/").filter((p) => p.length > 0).length;
  if (pathDepth > 8) {
    addSignal("Very deep path structure", "WEAK");
  }

  // ── UNUSUAL PORT ────────────────────────────────────────────────────
  if (url.port && !["80", "443", "8080", "8443"].includes(url.port)) {
    addSignal(`Uses non-standard port: ${url.port}`, "WEAK");
  }

  // ── EXCESSIVE SUBDOMAINS ────────────────────────────────────────────
  const subdomainParts = url.hostname.split(".");
  const excessiveSubdomainCount = subdomainParts.length - (result.registrableDomain?.split(".").length ?? 2);
  if (excessiveSubdomainCount > 3) {
    addSignal(`Unusual number of subdomains (${excessiveSubdomainCount})`, "WEAK");
  }

  // ── SUSPICIOUS TOKENS ───────────────────────────────────────────────
  // Keywords in the PATH or QUERY only; not the registrable domain itself.
  // These are WEAK signals alone — legitimate login pages also use these words.
  const PHISHING_TOKENS_IN_PATH = ["otp", "kyc", "urgent", "suspendedaccount", "verifyidentity"];
  const pathAndQuery = (url.pathname + "?" + url.search).toLowerCase();
  const foundPathTokens = PHISHING_TOKENS_IN_PATH.filter((t) => pathAndQuery.includes(t));
  if (foundPathTokens.length > 0) {
    addSignal(`Path/query contains phishing-associated keywords: ${foundPathTokens.join(", ")}`, "WEAK");
  }

  // Check sensitive keywords in the hostname (subdomain portion) — slightly more suspicious
  const SENSITIVE_HOST_TOKENS = ["secure-login", "account-verify", "update-payment", "banking-alert"];
  const subdomainStr = url.hostname
    .slice(0, url.hostname.length - (result.registrableDomain?.length ?? 0))
    .toLowerCase();
  if (SENSITIVE_HOST_TOKENS.some((t) => subdomainStr.includes(t))) {
    addSignal("Subdomain contains phrasing typically associated with phishing pages", "MODERATE");
  }

  // ── BRAND IMPERSONATION ─────────────────────────────────────────────
  // Only fires when a known brand name appears in the hostname but NOT as its registrable domain
  const registrableLower = (result.registrableDomain ?? "").toLowerCase();
  for (const [brand, legitimateDomains] of Object.entries(KNOWN_BRAND_DOMAINS)) {
    const hostnameContainsBrand = url.hostname.toLowerCase().includes(brand);
    const isLegitimateOfficialDomain = legitimateDomains.some(
      (d) => registrableLower === d || registrableLower.endsWith(`.${d}`)
    );

    if (hostnameContainsBrand && !isLegitimateOfficialDomain) {
      // Only a MODERATE signal — brand names also appear legitimately in partner domains
      addSignal(`"${brand}" appears in hostname but this is not a recognized official ${brand} domain`, "MODERATE");
    }
  }

  return result;
}
