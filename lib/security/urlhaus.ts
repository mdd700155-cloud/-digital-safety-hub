import { ThreatIntel } from "@/types/analysis";

export async function checkUrlhaus(url: string): Promise<ThreatIntel | undefined> {
  const authKey = process.env.URLHAUS_AUTH_KEY;
  
  if (!authKey || authKey === "") {
    // URLhaus disabled or key not provided; fail gracefully without crashing
    console.warn("URLHAUS_AUTH_KEY is not set. Skipping URLhaus check.");
    return undefined;
  }

  try {
    const response = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Auth-Key": authKey
      },
      body: new URLSearchParams({ url: url }).toString(),
      // Use a reasonable timeout so we don't block the analysis for too long if abuse.ch is down
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.warn(`URLhaus API returned status ${response.status}`);
      return undefined; // Fail gracefully
    }

    const data = await response.json();
    
    // According to URLhaus v1 url info API, query_status "ok" means the URL is known to URLhaus
    if (data.query_status === "ok") {
      return {
        source: "URLhaus (abuse.ch)",
        match: true,
        details: "URLhaus reports this URL as associated with malware distribution.",
        url_status: data.url_status,
        tags: data.tags
      };
    } else if (data.query_status === "no_results") {
      return {
        source: "URLhaus (abuse.ch)",
        match: false,
        details: "No known malware distribution match found in URLhaus."
      };
    }
    
    return undefined;
  } catch (error) {
    console.warn("URLhaus check failed:", error);
    return undefined; // Fail gracefully
  }
}
