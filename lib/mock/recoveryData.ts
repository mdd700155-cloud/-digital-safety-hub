export interface RecoveryChecklist {
  id: string;
  category: string;
  steps: string[];
}

export const recoveryChecklists: RecoveryChecklist[] = [
  {
    id: "money-transferred",
    category: "Money transferred",
    steps: [
      "Contact your bank or payment provider immediately. Call their official customer care number and ask to freeze your account or block the transaction.",
      "Preserve evidence. Take screenshots of all messages, transaction details, and the scammer's profile or phone number.",
      "File an official complaint. In India, call 1930 or visit cybercrime.gov.in to report financial fraud immediately.",
      "Do not engage further with the scammer. They may try to trick you into sending more money to 'recover' your lost funds."
    ]
  },
  {
    id: "otp-shared",
    category: "OTP/password/PIN shared",
    steps: [
      "Change your passwords immediately for the affected account and any other accounts that use the same password.",
      "Enable Two-Factor Authentication (2FA) on your important accounts using an authenticator app, not just SMS.",
      "Log out of all devices. Most services have a 'Sign out of all sessions' option in their security settings.",
      "If it was a banking OTP, contact your bank immediately to block your card or account.",
      "Monitor your accounts closely for any unauthorized activity over the next few weeks."
    ]
  },
  {
    id: "link-clicked",
    category: "Suspicious link clicked",
    steps: [
      "Disconnect from the internet immediately if you suspect malware was downloaded (turn off Wi-Fi/mobile data).",
      "Run a full system scan using a reputable antivirus or anti-malware software.",
      "If you entered any credentials on the fake site, change those passwords immediately on the real website.",
      "Clear your browser cache and cookies.",
      "Keep an eye on your accounts for any strange login attempts."
    ]
  },
  {
    id: "identity-shared",
    category: "Personal/identity information shared",
    steps: [
      "Be highly alert for targeted phishing attacks. Scammers now know your details and will use them to make future scams look convincing.",
      "If you shared a PAN or Aadhaar card, monitor your credit report (CIBIL) regularly for any unauthorized loans or credit cards opened in your name.",
      "Warn your family and friends. Scammers might use your identity to trick them into sending money.",
      "Report the identity theft to the national cybercrime portal."
    ]
  }
];
