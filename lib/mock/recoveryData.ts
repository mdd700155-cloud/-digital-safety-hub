export interface RecoveryChecklist {
  id: string;
  category: string;
  steps: string[];
}

export const recoveryChecklists: RecoveryChecklist[] = [
  {
    id: "money-upi-bank-fraud",
    category: "Money / UPI / Bank fraud",
    steps: [
      "Contact your bank or payment provider immediately and request a freeze or reversal if possible.",
      "Preserve evidence: screenshots, transaction IDs, UTR numbers, timestamps, and recipient IDs.",
      "Report the incident on the National Cyber Crime Reporting Portal and call 1930 for urgent financial fraud assistance.",
      "Do not share OTPs or banking credentials with anyone claiming to help recover funds."
    ]
  },
  {
    id: "otp-credential-theft",
    category: "OTP / PIN / Password / Credential theft",
    steps: [
      "Change passwords immediately and use unique passwords for each account.",
      "Enable authenticator-based 2FA where possible and remove SMS-based 2FA if you can use stronger methods.",
      "Contact your bank or affected provider if banking credentials were exposed.",
      "Preserve message screenshots and report the incident to the national portal."
    ]
  },
  {
    id: "phishing-fake-website",
    category: "Phishing / Fake website",
    steps: [
      "Do not enter any further information on the suspected site and close the page immediately.",
      "If you entered credentials, change them on the legitimate site and enable 2FA.",
      "Take screenshots and copy the suspicious URL for reporting to the authorities and your bank.",
      "Report the URL via the official National Cyber Crime Reporting Portal."
    ]
  },
  {
    id: "fake-support-impersonation",
    category: "Fake customer support / Impersonation",
    steps: [
      "Do not follow any instructions that ask you to share OTPs, passwords, or install software.",
      "Contact the official support channel of the service using contact details from the official website (not the caller/message).",
      "Preserve all chat transcripts, call records, and screenshots for evidence.",
      "Report impersonation to the national portal and to the service provider."
    ]
  },
  {
    id: "kyc-account-suspension",
    category: "KYC / Account suspension scam",
    steps: [
      "Legitimate services rarely ask for credentials or KYC documents via random links — verify via official channels.",
      "Do not upload documents to unknown sites. If you did, contact the service provider immediately.",
      "Preserve evidence and report to the national cybercrime portal."
    ]
  },
  {
    id: "investment-trading-crypto",
    category: "Investment / Trading / Crypto scam",
    steps: [
      "Stop any further transfers and preserve transaction evidence.",
      "Contact your bank and cryptocurrency exchange support immediately.",
      "Report the incident on the national portal and to the exchange's security team."
    ]
  },
  {
    id: "job-employment-scam",
    category: "Job / Employment scam",
    steps: [
      "Do not provide bank details or pay any fees for 'job offers'.",
      "Preserve communication and reporting details, and report to the national portal if you lost money or were coerced.",
      "Warn others by sharing the suspect contact info with trusted communities."
    ]
  },
  {
    id: "online-shopping-delivery",
    category: "Online shopping / Delivery scam",
    steps: [
      "Contact the marketplace or delivery provider through official channels.",
      "Preserve order IDs, payment confirmations, and chat transcripts.",
      "Report fraud to your payment provider and the national portal."
    ]
  },
  {
    id: "loan-credit-scam",
    category: "Loan / Credit scam",
    steps: [
      "Do not share personal documents or pay advance fees for loan approvals.",
      "Preserve evidence and report the incident to the national portal and financial regulator if appropriate.",
    ]
  },
  {
    id: "romance-relationship-scam",
    category: "Romance / Relationship scam",
    steps: [
      "Stop contact and preserve all communication and payment records.",
      "Do not send more money or personal documents. Report the incident to the national portal if coerced or extorted."
    ]
  },
  {
    id: "social-media-takeover",
    category: "Social media account takeover",
    steps: [
      "Attempt account recovery via the platform's official recovery tools and change passwords on linked accounts.",
      "Preserve evidence and report the takeover to the platform and the national portal if threatened or extorted."
    ]
  },
  {
    id: "hacking-unauthorized-access",
    category: "Hacking / Unauthorized account access",
    steps: [
      "Disconnect the affected device from the internet and run a malware scan.",
      "Change passwords and enable stronger authentication methods.",
      "Preserve logs and report the incident to the national portal."
    ]
  },
  {
    id: "sim-mobile-fraud",
    category: "SIM / Mobile-related fraud",
    steps: [
      "Contact your mobile operator immediately to block the SIM and report fraudulent porting or SIM swap.",
      "Preserve any messages and call records and report to the national portal if financial loss occurred."
    ]
  },
  {
    id: "digital-arrest-impersonation",
    category: "Digital arrest / Impersonation scam",
    steps: [
      "Do not comply with threats. Verify any legal notices through official government channels.",
      "Preserve all messages and caller details, and report to the national portal for official guidance."
    ]
  },
  {
    id: "sextortion",
    category: "Sextortion / intimate-image blackmail",
    steps: [
      "Do not pay or engage with the extortionist.",
      "Preserve evidence and seek local law enforcement support. Use the national portal's women/child reporting pathways if appropriate.",
      "Consider reaching out to trusted support organizations that handle sensitive abuse."
    ]
  },
  {
    id: "nonconsensual-intimate-sharing",
    category: "Non-consensual intimate image/video sharing",
    steps: [
      "Preserve evidence and do not redistribute the content.",
      "Report immediately via official channels and seek legal guidance and support services."
    ]
  },
  {
    id: "deepfake-ai-impersonation",
    category: "Deepfake / AI-generated impersonation",
    steps: [
      "Preserve the media and metadata and do not share widely.",
      "Report to the platform hosting the content and to the national portal if used for harassment or extortion."
    ]
  },
  {
    id: "cyberbullying",
    category: "Cyberbullying / Online harassment",
    steps: [
      "Preserve messages, screenshots, and any witness information.",
      "Report to the platform and consider reporting to the national portal if threats or abuse continue."
    ]
  },
  {
    id: "child-abuse",
    category: "Child-related online abuse / Exploitation",
    steps: [
      "Preserve evidence and do not attempt to investigate or engage with perpetrators.",
      "Immediately report to the national portal and child-protection services. Use anonymous reporting if available."
    ]
  },
  {
    id: "other-cybercrime",
    category: "Other cybercrime",
    steps: [
      "Preserve all evidence and consider reporting via the national portal. If urgent harm is suspected, contact local law enforcement.",
    ]
  }
];
