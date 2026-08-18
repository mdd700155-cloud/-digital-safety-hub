export interface SafetyTopic {
  id: string;
  title: string;
  description: string;
  howItWorks: string;
  warningSigns: string[];
  example: string;
  whatToDo: string[];
}

export const safetyTopics: SafetyTopic[] = [
  {
    id: "phishing",
    title: "Phishing Links & Messages",
    description: "Scammers send fake messages pretending to be from trusted organizations to steal your information.",
    howItWorks: "They typically send an SMS, WhatsApp message, or email claiming your account is blocked, a package is delayed, or you owe money. They include a link to a fake website that looks exactly like the real one.",
    warningSigns: [
      "Urgent or threatening language (e.g., 'Your account will be suspended in 24 hours')",
      "Generic greetings ('Dear Customer' instead of your name)",
      "Slightly misspelled email addresses or URLs",
      "Requests for passwords, OTPs, or credit card numbers"
    ],
    example: "Dear Customer, your HDFC bank account requires immediate KYC update to avoid blocking. Click here: http://hdfc-kyc-update.com/login",
    whatToDo: [
      "Never click suspicious links.",
      "Do not provide OTPs or passwords.",
      "Contact the organization directly using an official phone number or website."
    ]
  },
  {
    id: "upi-scams",
    title: "UPI & Payment Scams",
    description: "Fraudsters trick you into sending them money or authorizing payments under false pretenses.",
    howItWorks: "A common tactic is the 'Receive Money' scam. The scammer claims they are sending you money and asks you to scan a QR code or enter your UPI PIN to 'receive' the funds.",
    warningSigns: [
      "Being asked to enter your UPI PIN to *receive* money (you only need your PIN to *send* money)",
      "Unexpected payment requests on your UPI app",
      "Strangers offering to buy items you listed online without seeing them, and insisting on UPI"
    ],
    example: "I've sent the payment for the sofa. Just scan this QR code and enter your PIN to receive the ₹5000 in your account.",
    whatToDo: [
      "Remember: UPI PIN is ONLY for sending money, never for receiving.",
      "Decline unexpected payment requests in your UPI app.",
      "Never share your UPI PIN or OTP with anyone."
    ]
  },
  {
    id: "job-scams",
    title: "Fake Job Offers",
    description: "Scammers offer lucrative work-from-home jobs but require you to pay upfront fees or complete 'tasks'.",
    howItWorks: "You receive a message offering a high-paying part-time job (e.g., liking YouTube videos or reviewing products). They pay you a small amount initially to build trust, then ask you to 'invest' money to unlock higher-paying tasks.",
    warningSigns: [
      "Unsolicited job offers via WhatsApp or Telegram",
      "Promises of high income for very little work",
      "Requests to pay a 'registration fee' or 'security deposit'",
      "Being asked to perform 'tasks' or 'invest' to earn commission"
    ],
    example: "Congratulations! You have been selected for a part-time job earning ₹3000-₹5000/day. Just like YouTube videos. Reply YES to start.",
    whatToDo: [
      "Ignore unsolicited job offers via messaging apps.",
      "Never pay money to get a job.",
      "Research the company independently before engaging."
    ]
  }
];
