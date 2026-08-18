export type RiskLevel = "SAFE" | "SUSPICIOUS" | "HIGH_RISK";

export interface AnalysisResult {
  level: RiskLevel;
  summary: string;
  reason: string;
  indicators: string[];
  recommendations: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function mockAnalyze(content: string, type: "message" | "url" | "screenshot" | "qr"): Promise<AnalysisResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const lowerContent = content.toLowerCase();

  // Deterministic Mock Logic
  if (lowerContent.includes("urgent") || lowerContent.includes("password") || lowerContent.includes("http://") || lowerContent.includes("win") || lowerContent.includes("free")) {
    return {
      level: "HIGH_RISK",
      summary: "High risk of phishing or fraud detected.",
      reason: "The content contains multiple hallmarks of standard phishing attempts or malicious intent.",
      indicators: [
        "Creates artificial urgency",
        "Requests sensitive information",
        "Contains unsecured or suspicious links",
      ],
      recommendations: [
        "Do not click any links or download attachments.",
        "Do not reply to the sender.",
        "Delete the message immediately."
      ]
    };
  }

  if (lowerContent.includes("bank") || lowerContent.includes("verify") || lowerContent.includes("account") || lowerContent.includes("login")) {
    return {
      level: "SUSPICIOUS",
      summary: "This content looks suspicious.",
      reason: "It requests verification or mentions accounts, which are common tactics used in social engineering.",
      indicators: [
        "Mentions account verification",
        "Tone is slightly coercive",
        "Sender identity cannot be fully verified"
      ],
      recommendations: [
        "Verify the sender through an official, independent channel.",
        "Do not use the links provided; navigate to the website manually.",
        "If in doubt, contact the organization's official customer support."
      ]
    };
  }

  // Default Safe
  return {
    level: "SAFE",
    summary: "No obvious threats detected.",
    reason: "The content does not match any known malicious patterns or common scam indicators.",
    indicators: [
      "No suspicious links detected",
      "Tone appears normal",
      "No requests for sensitive data"
    ],
    recommendations: [
      "Always remain vigilant when interacting online.",
      "Never share your OTP or passwords with anyone.",
      "Check the sender's actual address if you are still unsure."
    ]
  };
}
