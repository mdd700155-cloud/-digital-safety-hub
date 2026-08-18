export interface UrlSignalResult {
  isMalformed: boolean;
  normalizedUrl: string | null;
  hostname: string | null;
  signals: string[];
}

const SUSPICIOUS_TOKENS = [
  "login", "verify", "secure", "account", "update", "payment", "wallet",
  "banking", "password", "otp", "reward", "claim", "urgent", "kyc", "auth"
];

const KNOWN_BRANDS = [
  "paypal", "apple", "google", "amazon", "microsoft", "netflix", "facebook",
  "instagram", "whatsapp", "hdfc", "sbi", "icici", "axis"
];

export function analyzeUrl(rawUrl: string): UrlSignalResult {
  const result: UrlSignalResult = {
    isMalformed: false,
    normalizedUrl: null,
    hostname: null,
    signals: []
  };

  let url: URL;
  
  try {
    // Add protocol if missing to try to parse, but flag it
    let parseUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(parseUrl)) {
      parseUrl = "http://" + parseUrl;
      result.signals.push("Missing protocol (http/https)");
    }
    
    url = new URL(parseUrl);
    result.normalizedUrl = url.toString();
    result.hostname = url.hostname;
    
  } catch {
    result.isMalformed = true;
    result.signals.push("Malformed URL structure");
    return result;
  }

  // Structure Checks
  if (url.protocol !== "https:") {
    result.signals.push("Uses unencrypted HTTP connection");
  }

  // IP Address check
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipRegex.test(url.hostname)) {
    result.signals.push("Uses IP address instead of hostname");
  }

  // Length and depth
  if (url.hostname.length > 60) {
    result.signals.push("Unusually long hostname");
  }
  if (url.toString().length > 150) {
    result.signals.push("Unusually long URL length");
  }
  
  const pathDepth = url.pathname.split("/").filter(p => p.length > 0).length;
  if (pathDepth > 5) {
    result.signals.push("Excessive path depth");
  }

  // Unusual port
  if (url.port && !["80", "443"].includes(url.port)) {
    result.signals.push(`Unusual port specified (${url.port})`);
  }

  // Obfuscation
  if (url.username || url.password) {
    result.signals.push("Contains user credentials (user@host)");
  }
  
  if (url.hostname.includes("xn--")) {
    result.signals.push("Uses Punycode (homograph attack risk)");
  }

  if (url.toString().includes("@") && !url.username && !url.password) {
      result.signals.push("Contains suspicious delimiters (@) in path/query");
  }

  // Token analysis
  const lowerUrl = url.toString().toLowerCase();
  let foundTokens = 0;
  for (const token of SUSPICIOUS_TOKENS) {
    if (lowerUrl.includes(token)) {
      foundTokens++;
    }
  }
  if (foundTokens > 0) {
    result.signals.push(`Contains ${foundTokens} suspicious keyword(s) often used in phishing`);
  }

  // Brand Impersonation check
  // Simple check: brand name is in the hostname, but the domain doesn't end with brand.com
  const domainParts = url.hostname.split('.');
  const registrableDomain = domainParts.length >= 2 ? domainParts.slice(-2).join('.') : url.hostname;
  
  for (const brand of KNOWN_BRANDS) {
    if (url.hostname.includes(brand)) {
      if (!registrableDomain.includes(brand)) {
        result.signals.push(`Possible brand impersonation (${brand} found in subdomain)`);
      }
    }
  }

  return result;
}
