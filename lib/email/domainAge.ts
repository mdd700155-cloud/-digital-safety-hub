/**
 * Domain Age / WHOIS Check
 *
 * Looks up domain registration date using RDAP (Registration Data
 * Access Protocol) — the ICANN-sanctioned JSON-over-HTTP replacement
 * for traditional WHOIS. No API key needed.
 *
 * Flags domains registered within the last 30 days as high-risk.
 */

import { DomainAgeResult } from "@/types/emailAnalysis";

/**
 * Look up domain registration date via RDAP.
 *
 * @param domain - The domain to check (e.g. "example.com")
 * @returns Domain age data or an unavailable result
 */
export async function checkDomainAge(domain: string): Promise<DomainAgeResult> {
  const unavailable: DomainAgeResult = {
    domain,
    registrationDate: "",
    ageDays: -1,
    isNewDomain: false,
    available: false,
  };

  if (!domain) {
    return unavailable;
  }

  try {
    // RDAP bootstrap: rdap.org will redirect to the authoritative RDAP server
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: {
        Accept: "application/rdap+json, application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`RDAP lookup returned status ${response.status} for ${domain}`);
      return unavailable;
    }

    const data = await response.json();

    // RDAP events array contains lifecycle events
    // Look for "registration" event type
    let registrationDate = "";

    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        if (event.eventAction === "registration" && event.eventDate) {
          registrationDate = event.eventDate;
          break;
        }
      }

      // Fallback: some registrars use different event names
      if (!registrationDate) {
        for (const event of data.events) {
          if (
            (event.eventAction === "last changed" || event.eventAction === "last update of RDAP database") &&
            event.eventDate
          ) {
            // Not ideal, but better than nothing
            registrationDate = event.eventDate;
            break;
          }
        }
      }
    }

    if (!registrationDate) {
      return unavailable;
    }

    // Calculate age in days
    const regDate = new Date(registrationDate);
    const now = new Date();
    const ageDays = Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
    const isNewDomain = ageDays >= 0 && ageDays <= 30;

    return {
      domain,
      registrationDate,
      ageDays,
      isNewDomain,
      available: true,
    };
  } catch (error) {
    console.warn(`RDAP lookup failed for ${domain}:`, error);
    return unavailable;
  }
}
