import fs from "fs";
import path from "path";

export type MlSignal = "LOW_RISK_SIGNAL" | "SUSPICIOUS_SIGNAL" | "HIGH_RISK_SIGNAL";

export interface MlClassification {
  available: boolean;
  modelVersion?: string;
  signal?: MlSignal;
  score?: number; // optional calibrated score in [0,1]
}

function entropyOfString(s: string): number {
  if (!s || s.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const ch of s) freq[ch] = (freq[ch] || 0) + 1;
  const probs = Object.values(freq).map((c) => c / s.length);
  return -probs.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0);
}

function isIpHostname(hostname: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

export function extractUrlFeatures(rawUrl: string) {
  const urlStr = rawUrl.trim();
  let parse = urlStr;
  if (!/^https?:\/\//i.test(parse)) {
    if (parse.startsWith("//")) parse = "http:" + parse;
    else parse = "http://" + parse;
  }

  let urlObj: URL;
  try {
    urlObj = new URL(parse);
  } catch {
    // return an empty feature vector for malformed URLs
    const order = [
      "url_length",
      "hostname_length",
      "path_length",
      "num_dots",
      "subdomain_count",
      "num_digits",
      "num_hyphens",
      "num_query_params",
      "num_path_segments",
      "has_ip",
      "has_at",
      "has_pct_encoding",
      "has_punycode",
      "is_https",
      "unusual_port",
      "hostname_entropy",
      "path_entropy",
    ];
    return { featureOrder: order, features: order.map(() => 0) };
  }

  const hostname = urlObj.hostname;
  const pathname = urlObj.pathname || "";
  const search = urlObj.search || "";

  const url_length = rawUrl.length;
  const hostname_length = hostname.length;
  const path_length = pathname.length;
  const num_dots = hostname.split(".").length - 1;
  const subdomain_count = Math.max(0, hostname.split(".").length - 2);
  const num_digits = (rawUrl.match(/\d/g) || []).length;
  const num_hyphens = (rawUrl.match(/-/g) || []).length;
  const num_query_params = new URLSearchParams(search).toString() ? new URLSearchParams(search).toString().split("&").length : 0;
  const num_path_segments = pathname.split("/").filter((p) => p.length > 0).length;
  const has_ip = isIpHostname(hostname) ? 1 : 0;
  const has_at = rawUrl.includes("@") ? 1 : 0;
  const has_pct_encoding = /%[0-9A-Fa-f]{2}/.test(rawUrl) ? 1 : 0;
  const has_punycode = hostname.includes("xn--") ? 1 : 0;
  const is_https = urlObj.protocol === "https:" ? 1 : 0;
  const unusual_port = urlObj.port && !["80", "443", "8080", "8443"].includes(urlObj.port) ? 1 : 0;
  const hostname_entropy = entropyOfString(hostname);
  const path_entropy = entropyOfString(pathname + search);

  const featureOrder = [
    "url_length",
    "hostname_length",
    "path_length",
    "num_dots",
    "subdomain_count",
    "num_digits",
    "num_hyphens",
    "num_query_params",
    "num_path_segments",
    "has_ip",
    "has_at",
    "has_pct_encoding",
    "has_punycode",
    "is_https",
    "unusual_port",
    "hostname_entropy",
    "path_entropy",
  ];

  const features = [
    url_length,
    hostname_length,
    path_length,
    num_dots,
    subdomain_count,
    num_digits,
    num_hyphens,
    num_query_params,
    num_path_segments,
    has_ip,
    has_at,
    has_pct_encoding,
    has_punycode,
    is_https,
    unusual_port,
    hostname_entropy,
    path_entropy,
  ];

  return { featureOrder, features };
}

export async function classifyUrl(rawUrl: string): Promise<MlClassification> {
  try {
    const modelPath = process.env.ML_URL_MODEL_PATH || path.join(process.cwd(), "lib", "security", "models", "ml_model.json");
    if (!fs.existsSync(/*turbopackIgnore: true*/ modelPath)) {
      return { available: false };
    }

    const data = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ modelPath, "utf-8"));
    const { version, intercept, coefficients, threshold } = data;

    const { featureOrder, features } = extractUrlFeatures(rawUrl);

    // Ensure feature order alignment
    let linear = intercept || 0;
    for (let i = 0; i < featureOrder.length; i++) {
      const name = featureOrder[i];
      const coef = coefficients && Object.prototype.hasOwnProperty.call(coefficients, name) ? coefficients[name] : 0;
      linear += coef * (features[i] || 0);
    }

    const score = 1 / (1 + Math.exp(-linear));

    const thr = typeof threshold === "number" ? threshold : 0.6;
    let signal: MlSignal = "LOW_RISK_SIGNAL";
    if (score >= Math.min(0.95, thr + 0.2)) signal = "HIGH_RISK_SIGNAL";
    else if (score >= thr) signal = "SUSPICIOUS_SIGNAL";

    return { available: true, modelVersion: version, signal, score };
  } catch {
    return { available: false };
  }
}

