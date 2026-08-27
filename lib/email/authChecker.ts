/**
 * SPF / DKIM / DMARC Authentication Checker
 *
 * Performs DNS TXT record lookups against the sending domain to
 * determine SPF, DKIM, and DMARC pass/fail/none status.
 *
 * Approach:
 *   1. First check the Authentication-Results header if present
 *      (the receiving MTA already computed these).
 *   2. If no Authentication-Results, perform DNS TXT lookups
 *      to verify record existence.
 *
 * Note: We cannot fully *validate* SPF/DKIM without the original
 * SMTP transaction data, but we can check whether records exist
 * and parse any pre-computed results from the email headers.
 */

import dns from "dns";
import { AuthCheckResult, AuthStatus } from "@/types/emailAnalysis";

const dnsResolve = dns.promises.resolveTxt;

/**
 * Parse the Authentication-Results header for SPF/DKIM/DMARC verdicts.
 * Format varies by provider but typically contains lines like:
 *   spf=pass (google.com: ...)
 *   dkim=pass header.i=@example.com
 *   dmarc=pass (p=NONE sp=NONE ...)
 */
function parseAuthenticationResults(header: string): {
  spf: AuthStatus;
  dkim: AuthStatus;
  dmarc: AuthStatus;
} {
  const result: { spf: AuthStatus; dkim: AuthStatus; dmarc: AuthStatus } = {
    spf: "none",
    dkim: "none",
    dmarc: "none",
  };

  if (!header) return result;

  const lower = header.toLowerCase();

  // SPF
  const spfMatch = lower.match(/spf=(pass|fail|softfail|neutral|none|temperror|permerror)/);
  if (spfMatch) {
    result.spf = spfMatch[1] === "pass" ? "pass" : "fail";
  }

  // DKIM
  const dkimMatch = lower.match(/dkim=(pass|fail|neutral|none|temperror|permerror)/);
  if (dkimMatch) {
    result.dkim = dkimMatch[1] === "pass" ? "pass" : "fail";
  }

  // DMARC
  const dmarcMatch = lower.match(/dmarc=(pass|fail|none|bestguesspass)/);
  if (dmarcMatch) {
    result.dmarc = dmarcMatch[1] === "pass" || dmarcMatch[1] === "bestguesspass" ? "pass" : "fail";
  }

  return result;
}

/**
 * Lookup TXT records for a domain and check for the presence of specific records.
 */
async function lookupTxtRecord(domain: string, prefix?: string): Promise<string> {
  try {
    const target = prefix ? `${prefix}.${domain}` : domain;
    const records = await dnsResolve(target);
    // TXT records are arrays of string arrays — join them
    const flat = records.map((r) => r.join("")).join("\n");
    return flat;
  } catch {
    return "";
  }
}

/**
 * Check SPF/DKIM/DMARC for a sending domain.
 *
 * @param domain - The sending domain to check
 * @param authResultsHeader - The Authentication-Results header from the email, if available
 */
export async function checkEmailAuth(
  domain: string,
  authResultsHeader: string
): Promise<AuthCheckResult> {
  // If we have an Authentication-Results header, prefer those pre-computed results
  if (authResultsHeader) {
    const parsed = parseAuthenticationResults(authResultsHeader);

    // Still look up the raw records for display purposes
    const [spfRecord, dmarcRecord] = await Promise.allSettled([
      lookupTxtRecord(domain),
      lookupTxtRecord(`_dmarc.${domain}`),
    ]);

    const spfRecordText = spfRecord.status === "fulfilled" ? spfRecord.value : "";
    const dmarcRecordText = dmarcRecord.status === "fulfilled" ? dmarcRecord.value : "";

    // Extract SPF-specific record
    const spfLine = spfRecordText
      .split("\n")
      .find((line) => line.startsWith("v=spf1")) ?? "";

    return {
      spf: parsed.spf,
      spfRecord: spfLine,
      dkim: parsed.dkim,
      dkimRecord: "(verified from Authentication-Results header)",
      dmarc: parsed.dmarc,
      dmarcRecord: dmarcRecordText.split("\n").find((line) => line.startsWith("v=DMARC1")) ?? "",
      fromHeader: true,
    };
  }

  // No Authentication-Results — perform DNS lookups
  const [spfRaw, dmarcRaw] = await Promise.allSettled([
    lookupTxtRecord(domain),
    lookupTxtRecord(`_dmarc.${domain}`),
  ]);

  const spfRecordText = spfRaw.status === "fulfilled" ? spfRaw.value : "";
  const dmarcRecordText = dmarcRaw.status === "fulfilled" ? dmarcRaw.value : "";

  // Check SPF record existence
  const spfLine = spfRecordText.split("\n").find((line) => line.startsWith("v=spf1")) ?? "";
  let spf: AuthStatus = "none";
  if (spfLine) {
    // Record exists — we can't fully evaluate without the SMTP envelope,
    // but presence of a record is a positive signal
    spf = "pass"; // Record exists (best-effort)
  }

  // Check DMARC record existence
  const dmarcLine = dmarcRecordText.split("\n").find((line) => line.startsWith("v=DMARC1")) ?? "";
  let dmarc: AuthStatus = "none";
  if (dmarcLine) {
    dmarc = "pass"; // Record exists
    // Check for reject/quarantine policy
    if (dmarcLine.includes("p=reject") || dmarcLine.includes("p=quarantine")) {
      dmarc = "pass"; // Strong DMARC policy in place
    }
  }

  // DKIM requires knowing the selector, which is in the DKIM-Signature header.
  // Without the email headers available here, we mark it as "none".
  const dkim: AuthStatus = "none";

  return {
    spf,
    spfRecord: spfLine,
    dkim,
    dkimRecord: "(DKIM selector not available for direct lookup)",
    dmarc,
    dmarcRecord: dmarcLine,
    fromHeader: false,
  };
}
