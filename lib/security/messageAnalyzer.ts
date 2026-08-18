export interface MessageSignalResult {
  extractedUrls: string[];
  signals: string[];
}

const URGENCY_WORDS = ["urgent", "immediate", "suspend", "block", "alert", "warning", "action required", "act now"];
const SENSITIVE_WORDS = ["password", "otp", "pin", "cvv", "credit card", "bank account", "social security", "aadhar", "pan"];
const SCAM_PATTERNS = ["lottery", "winner", "selected for a job", "part-time job", "earn money daily", "invest", "crypto", "bitcoin", "digital arrest", "customs clearance", "fedex parcel"];

export function analyzeMessage(message: string): MessageSignalResult {
  const result: MessageSignalResult = {
    extractedUrls: [],
    signals: []
  };

  if (!message || message.trim().length === 0) {
    return result;
  }

  const lowerMsg = message.toLowerCase();

  // Extract URLs (simple regex for http/https and www)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  const matches = message.match(urlRegex);
  if (matches) {
    result.extractedUrls = matches.map(u => u.startsWith('www.') ? 'http://' + u : u);
    result.signals.push(`Contains ${matches.length} embedded link(s)`);
  }

  // Urgency check
  if (URGENCY_WORDS.some(w => lowerMsg.includes(w))) {
    result.signals.push("Creates a sense of urgency or threat");
  }

  // Sensitive info check
  if (SENSITIVE_WORDS.some(w => lowerMsg.includes(w))) {
    result.signals.push("Requests sensitive personal or financial information");
  }

  // Scam pattern check
  if (SCAM_PATTERNS.some(w => lowerMsg.includes(w))) {
    result.signals.push("Contains keywords associated with known scam templates");
  }

  // Shortener check
  if (lowerMsg.includes("bit.ly") || lowerMsg.includes("tinyurl") || lowerMsg.includes("t.co")) {
    result.signals.push("Uses a URL shortener which masks the true destination");
  }

  return result;
}
