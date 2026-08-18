/**
 * Voice Scam Signal Detection — deterministic pattern engine.
 *
 * Every signal is produced ONLY from real matches in the transcript.
 * Confidence values are computed from the number and weight of distinct
 * patterns that matched — never fabricated.
 */

import { ScamCategory, SignalSeverity, VoiceSignal } from "@/types/voiceAnalysis";

interface SignalDefinition {
  id: string;
  label: string;
  severity: SignalSeverity;
  patterns: RegExp[];
  /** Confidence added per distinct pattern matched (capped at 100). */
  weightPerPattern: number;
  explanation: string;
  recommendation: string;
}

const SNIPPET_LIMIT = 160;

function snippet(match: string): string {
  const cleaned = match.replace(/\s+/g, " ").trim();
  return cleaned.length > SNIPPET_LIMIT ? `${cleaned.slice(0, SNIPPET_LIMIT)}…` : cleaned;
}

export const VOICE_SIGNAL_DEFINITIONS: SignalDefinition[] = [
  {
    id: "urgency",
    label: "Urgency",
    severity: "MEDIUM",
    patterns: [
      /urgent/i,
      /immediately/i,
      /right now/i,
      /act now/i,
      /as soon as possible/i,
      /within\s+(\d+|a few|half an|one)\s+(minutes?|hours?)/i,
      /before it'?s too late/i,
      /at once/i,
      /no time to waste/i,
    ],
    weightPerPattern: 15,
    explanation:
      "The caller pressures you to act quickly so you don't have time to think, verify, or consult someone.",
    recommendation:
      "Slow down. Legitimate organizations never force you to act in minutes. Verify the caller through official channels first.",
  },
  {
    id: "fear_manipulation",
    label: "Fear Manipulation",
    severity: "HIGH",
    patterns: [
      /your (bank )?account will be (closed|blocked|suspended|deactivated|frozen)/i,
      /your (aadhaar|pan|account|card|number) (will|could) be (blocked|misused|suspended)/i,
      /everything will be lost/i,
      /you will (go to|be sent to) jail/i,
      /you (will|could) be arrested/i,
      /serious consequences/i,
      /money will be lost forever/i,
      /your (aadhaar|pan|number) will be (misused|blocked)/i,
    ],
    weightPerPattern: 18,
    explanation:
      "The caller uses fear of losing money, access, or freedom to make you comply without thinking.",
    recommendation:
      "Recognize fear as a manipulation tool. Take a pause, do not respond to threats, and verify independently.",
  },
  {
    id: "threat_language",
    label: "Threats & Legal Action",
    severity: "HIGH",
    patterns: [
      /legal action/i,
      /case (has been|will be) filed/i,
      /police complaint/i,
      /arrest warrant/i,
      /FIR/i,
      /investigation against you/i,
      /court (notice|order|summon)/i,
    ],
    weightPerPattern: 16,
    explanation:
      "The caller threatens legal or police action to intimidate you into paying or sharing information.",
    recommendation:
      "Real legal notices never arrive by phone call demanding payment. Do not pay or share anything; verify with the official agency directly.",
  },
  {
    id: "authority_impersonation",
    label: "Authority Impersonation",
    severity: "HIGH",
    patterns: [
      /this is the cybercrime department/i,
      /this is (the )?(cybercrime|cyber crime) (department|cell|police)/i,
      /(cybercrime|cyber crime) (department|cell|police)/i,
      /this is (the )?(cyber cell|cyber crime cell)/i,
      /reserve bank of india|RBI/i,
      /customs department/i,
      /narcotics (bureau|cell|department)/i,
      /income tax department/i,
      /senior official|inspector|officer speaking/i,
      /from (the )?central bureau/i,
    ],
    weightPerPattern: 18,
    explanation:
      "The caller claims to represent an official authority to create trust and pressure the victim.",
    recommendation:
      "Do not provide OTPs, passwords, banking information, or make payments based on the call. Call the official number of the agency yourself.",
  },
  {
    id: "gov_impersonation",
    label: "Police / Government Impersonation",
    severity: "HIGH",
    patterns: [
      /this is (the )?police/i,
      /police (station|inspector|officer)/i,
      /CBI|central bureau of investigation/i,
      /enforcement directorate|ED officer/i,
      /cyber (cell|police|cop) here/i,
    ],
    weightPerPattern: 18,
    explanation:
      "The caller impersonates law enforcement, which real police never do to demand money or 'verification'.",
    recommendation:
      "Police never conduct arrests, 'digital arrests', or money collection over the phone. Hang up and report the call.",
  },
  {
    id: "financial_request",
    label: "Financial Request",
    severity: "HIGH",
    patterns: [
      /(pay|transfer|deposit|send)\s+(money|the amount|the fine|a fee|the settlement)/i,
      /pay (the |any |this )?(fine|fee|amount|charges)/i,
      /pay the (fine|fee|amount|charges)/i,
      /release (fee|money|amount|your parcel)/i,
      /verification (fee|deposit|amount|money)/i,
      /(settle|clear) (the|your) (case|fine|dues)/i,
    ],
    weightPerPattern: 16,
    explanation:
      "The caller asks you to send money, often for fake fines, fees, or 'verification'.",
    recommendation:
      "Do not transfer money to anyone who contacted you. Legitimate authorities never ask for payments over the phone.",
  },
  {
    id: "otp_request",
    label: "OTP Request",
    severity: "HIGH",
    patterns: [
      /(share|tell|send) (me |us |the |your )?(otp|one time password|verification code)/i,
      /share (the|your) (otp|one time password|verification code)/i,
      /confirm (the|your) otp/i,
      /tell me (the|your) otp/i,
      /(otp|one time password|verification code)\s+(sent|received|is coming)/i,
    ],
    weightPerPattern: 20,
    explanation:
      "The caller asks for a one-time password. OTPs are personal credentials that no legitimate organization ever requests.",
    recommendation:
      "Never share OTPs, PINs, or passwords with anyone — including people claiming to be from your bank or police.",
  },
  {
    id: "credential_request",
    label: "Credential Request",
    severity: "HIGH",
    patterns: [
      /(your|the)\s+password/i,
      /internet banking (credentials|user id|login)/i,
      /(login|user)\s+(id|name)|user id/i,
      /net banking/i,
      /(your|the)\s+pin\b/i,
    ],
    weightPerPattern: 16,
    explanation:
      "The caller asks for login credentials or PINs that would let them access your accounts.",
    recommendation:
      "Never reveal passwords or login details. Change your credentials if you already shared anything.",
  },
  {
    id: "personal_info_request",
    label: "Personal Information Request",
    severity: "MEDIUM",
    patterns: [
      /aadhaar|adhaar|aadhar/i,
      /pan (card|number)/i,
      /(your|the) bank account (number|details)/i,
      /date of birth|DOB/i,
      /(your|the) full name and address/i,
      /card (number|details)|debit card|credit card/i,
      /CVV/i,
    ],
    weightPerPattern: 14,
    explanation:
      "The caller asks for personal or card details that can be used for identity theft or fraud.",
    recommendation:
      "Do not share Aadhaar, PAN, card, or bank details over an unsolicited call. Verify the caller officially first.",
  },
  {
    id: "payment_instructions",
    label: "Payment Instructions",
    severity: "HIGH",
    patterns: [
      /scan (this|the|a) QR/i,
      /send (it|money) to this (UPI|account|number)/i,
      /deposit (it|cash) (in|at) (the )?(ATM|bank|machine)/i,
      /buy (a )?(gift card|voucher)/i,
      /(pay|send) through (upi|paytm|phonepe|google pay|gpay)/i,
    ],
    weightPerPattern: 16,
    explanation:
      "The caller gives specific payment instructions — a common step in financial scams.",
    recommendation:
      "Refuse any instruction to scan, send, or deposit money. Legitimate refunds or verifications never work this way.",
  },
  {
    id: "remote_access",
    label: "Remote Access Request",
    severity: "HIGH",
    patterns: [
      /(install|download|open)\s+(anydesk|teamviewer|zoom|quick support|screen share)/i,
      /share (your )?screen/i,
      /remote (access|support)/i,
      /let me (see|view|access) your (phone|computer|screen)/i,
      /mirror your (phone|screen)/i,
    ],
    weightPerPattern: 20,
    explanation:
      "The caller wants remote access to your device, which lets them steal credentials and money directly.",
    recommendation:
      "Never install remote-access apps or share your screen with a caller. If you already did, disconnect and change all passwords.",
  },
  {
    id: "suspicious_link",
    label: "Suspicious Link / App",
    severity: "HIGH",
    patterns: [
      /click (on )?(this|the) link/i,
      /open (this|the) link/i,
      /download (this|the) app/i,
      /(the|this) link (will|will be) (sent|shared)/i,
    ],
    weightPerPattern: 15,
    explanation:
      "The caller directs you to a link or app that likely leads to a phishing site or malware.",
    recommendation:
      "Do not click links or download apps from an unknown caller. Check links with the URL analyzer instead.",
  },
  {
    id: "account_suspension",
    label: "Account Suspension Threat",
    severity: "MEDIUM",
    patterns: [
      /your account (will be|is about to be|has been) (suspended|blocked|deactivated|frozen|closed)/i,
      /your (UPI|bank|account) (will be|is going to be) (blocked|suspended)/i,
      /account (blocked|suspended|deactivated) (unless|within)/i,
      /your (number|SIM) (will be|is going to be) (deactivated|blocked|disconnected)/i,
    ],
    weightPerPattern: 16,
    explanation:
      "The caller threatens to block or suspend an account to create panic.",
    recommendation:
      "Ignore suspension threats. Check your accounts through official apps — do not act on a call.",
  },
  {
    id: "reward_manipulation",
    label: "Reward / Prize Manipulation",
    severity: "MEDIUM",
    patterns: [
      /cashback/i,
      /you (have|'ve) won/i,
      /(a )?(prize|lottery|gift)/i,
      /reward (for|payment)/i,
      /(unlock|claim) (your|the) (bonus|reward|gift)/i,
      /money (back|returned)/i,
    ],
    weightPerPattern: 14,
    explanation:
      "The caller dangles a reward or cashback to lure you into sharing details or paying a 'processing fee'.",
    recommendation:
      "Unsolicited rewards are a classic lure. Do not share details or pay fees to 'claim' anything.",
  },
  {
    id: "fake_customer_support",
    label: "Fake Customer Support",
    severity: "HIGH",
    patterns: [
      /(this is|calling from) (customer care|customer support|customer service|technical support)/i,
      /(amazon|flipkart|phonepe|paytm|bank|telecom) support/i,
      /refund (is|has been|will be|to be) (processed|initiated|reversed)/i,
      /reverse (the|your) (payment|transaction)/i,
      /(wrong|mistaken|extra) (payment|charge|deduction)/i,
    ],
    weightPerPattern: 16,
    explanation:
      "The caller pretends to be customer support, often for a refund or 'wrong charge', to extract OTPs or money.",
    recommendation:
      "Contact support only through official apps or websites. No legitimate support asks for OTPs or remote access.",
  },
  {
    id: "digital_arrest",
    label: "Digital Arrest Language",
    severity: "HIGH",
    patterns: [
      /digital arrest/i,
      /under (digital|online|video) (arrest|custody)/i,
      /(stay|remain) on (the )?(call|video call)/i,
      /do not (tell|inform|contact) anyone/i,
      /verification (transfer|payment|deposit) to (clear|avoid) arrest/i,
    ],
    weightPerPattern: 22,
    explanation:
      "This matches the 'digital arrest' scam pattern — fake authorities demanding money while keeping you on a call.",
    recommendation:
      "'Digital arrest' is a scam technique; it does not exist in law. Hang up, block the number, and report it.",
  },
  {
    id: "investment_fraud",
    label: "Investment / Trading Fraud",
    severity: "HIGH",
    patterns: [
      /guaranteed (returns?|profit|income)/i,
      /double (your|the) money/i,
      /(trading|investment) app/i,
      /stock (tips|market) (inside|secret)/i,
      /crypto (investment|trading)/i,
      /(high|big|huge) returns/i,
    ],
    weightPerPattern: 16,
    explanation:
      "The caller promotes investment opportunities with guaranteed returns — a hallmark of investment fraud.",
    recommendation:
      "There are no guaranteed returns. Verify any platform with SEBI/RBI and never invest based on a cold call.",
  },
  {
    id: "job_scam",
    label: "Job Scam Language",
    severity: "MEDIUM",
    patterns: [
      /part[- ]time job/i,
      /work from home/i,
      /earn (money|income) (daily|every day|per day|at home)/i,
      /like (youtube )?videos (and )?get paid/i,
      /(do|complete) (simple )?tasks (and )?(get|earn) paid/i,
      /registration (fee|charge)/i,
    ],
    weightPerPattern: 15,
    explanation:
      "The caller describes an easy, high-paying job or task — typical of job-scam recruitment pitches.",
    recommendation:
      "Real jobs never require upfront fees. Treat unsolicited 'task' offers as scams.",
  },
  {
    id: "delivery_scam",
    label: "Delivery / Parcel Scam",
    severity: "MEDIUM",
    patterns: [
      /parcel|courier/i,
      /customs (clearance|fee|charges)/i,
      /(your|a) (package|shipment) (is|has been) (held|stopped|seized)/i,
      /delivery (fee|charges|payment)/i,
      /undeliverable (parcel|package)/i,
    ],
    weightPerPattern: 15,
    explanation:
      "The caller claims a parcel or customs issue that requires payment — the basis of parcel scams.",
    recommendation:
      "Check your real tracking numbers directly with the courier. Customs never collects fees over the phone.",
  },
];

const CATEGORY_MAP: Partial<Record<string, ScamCategory>> = {
  otp_request: "OTP_THEFT",
  credential_request: "OTP_THEFT",
  account_suspension: "ACCOUNT_TAKEOVER",
  financial_request: "BANK_UPI_FRAUD",
  payment_instructions: "BANK_UPI_FRAUD",
  fake_customer_support: "FAKE_CUSTOMER_SUPPORT",
  digital_arrest: "DIGITAL_ARREST",
  gov_impersonation: "FAKE_GOVERNMENT",
  threat_language: "FAKE_GOVERNMENT",
  authority_impersonation: "IMPERSONATION",
  investment_fraud: "INVESTMENT_SCAM",
  job_scam: "JOB_SCAM",
  delivery_scam: "DELIVERY_SCAM",
};

export function detectVoiceSignals(transcript: string): VoiceSignal[] {
  const signals: VoiceSignal[] = [];

  for (const def of VOICE_SIGNAL_DEFINITIONS) {
    const evidence = new Set<string>();
    let matchedPatterns = 0;

    for (const pattern of def.patterns) {
      const matches = transcript.match(pattern);
      if (matches && matches.length > 0) {
        matchedPatterns += 1;
        // Use only the full match, never capture groups.
        const fullMatches = pattern.global ? matches : [matches[0]];
        for (const m of fullMatches) {
          const s = snippet(m);
          if (s) evidence.add(s);
        }
      }
    }

    if (matchedPatterns === 0) continue;

    const confidence = Math.min(100, matchedPatterns * def.weightPerPattern);

    signals.push({
      id: def.id,
      label: def.label,
      severity: def.severity,
      confidence,
      evidence: Array.from(evidence).slice(0, 4),
      explanation: def.explanation,
      recommendation: def.recommendation,
    });
  }

  return signals.sort((a, b) => b.confidence - a.confidence);
}

export function inferScamCategory(signals: VoiceSignal[]): {
  scamType: ScamCategory;
  uncertain: boolean;
} {
  const scores = new Map<ScamCategory, number>();

  for (const signal of signals) {
    const category = CATEGORY_MAP[signal.id];
    if (!category) continue;
    scores.set(category, (scores.get(category) ?? 0) + signal.confidence);
  }

  if (scores.size === 0) {
    return { scamType: "OTHER", uncertain: true };
  }

  const [topCategory, topScore] = Array.from(scores.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  // If even the strongest category is weakly supported, mark it as uncertain.
  const uncertain = topScore < 50;

  return { scamType: topCategory, uncertain };
}