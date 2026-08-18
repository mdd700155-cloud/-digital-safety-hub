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
  },
  {
    id: "qr-code-scams",
    title: "QR Code Scams",
    description: "Scammers use malicious QR codes that lead to fake payment pages, phishing websites, or hidden payment requests.",
    howItWorks: "A scammer shares a QR code claiming it is for a payment, cashback, recharge, or prize redemption. Scanning it can open a fake page that asks for your UPI PIN or OTP, or it may trigger an unexpected payment request.",
    warningSigns: [
      "A QR code that leads to a page asking for your UPI PIN or OTP",
      "Stickers pasted over the original QR codes at shops",
      "QR codes sent in messages offering money, cashback, or prizes",
      "A payment request appearing immediately after scanning"
    ],
    example: "Scan this QR code to receive your cashback of ₹2000. Hurry, the offer ends tonight!",
    whatToDo: [
      "Never enter your UPI PIN or OTP after scanning a QR code.",
      "Check the website URL a QR code opens before interacting with it.",
      "Prefer scanning payment QR codes inside your payment app instead of your camera."
    ]
  },
  {
    id: "otp-credential-theft",
    title: "OTP & Credential Theft",
    description: "Fraudsters call or message you pretending to be your bank, telecom operator, or courier company to extract your OTPs and passwords.",
    howItWorks: "The caller claims something urgent needs action — your SIM is being blocked, your KYC is incomplete, or a parcel is seized. They pressure you and ask you to share the OTP you just received, or 'confirm' your PIN or password.",
    warningSigns: [
      "Any call, SMS, or email asking for your OTP, PIN, or password",
      "Heavy pressure to act immediately or your 'account will be blocked'",
      "The caller claiming to be from your bank, telecom, or police"
    ],
    example: "Sir, your SIM card will be deactivated in 10 minutes. I am sending an OTP now — please confirm it to keep your number active.",
    whatToDo: [
      "Never share OTPs, PINs, or passwords with anyone — no legitimate organization asks for them.",
      "Hang up and call your bank or telecom using the official number on their website or app.",
      "Remember: OTPs are for authenticating you, never for 'verifying' someone else."
    ]
  },
  {
    id: "investment-crypto-scams",
    title: "Investment & Crypto Scams",
    description: "Fake investment apps and 'trading experts' promise guaranteed high returns to lure you into sending money.",
    howItWorks: "You are added to a WhatsApp or Telegram group where 'members' share profit screenshots. You invest a small amount and are even allowed to withdraw it once. When you invest a large amount, withdrawals stop and the app disappears.",
    warningSigns: [
      "Promises of guaranteed or 'risk-free' high returns",
      "Trading apps that are not available on official app stores",
      "Pressure to invest quickly before the 'offer closes'",
      "Being asked to deposit money into a personal bank account or UPI ID"
    ],
    example: "Our trading group has a 92% win rate. Minimum deposit ₹10,000 only. Here is my profit screenshot: [image].",
    whatToDo: [
      "Never trust 'guaranteed returns' — real investments always carry risk.",
      "Verify the platform is registered with SEBI or RBI before investing.",
      "Do not send money to personal accounts or UPI IDs for 'investments'."
    ]
  },
  {
    id: "online-shopping-delivery-scams",
    title: "Online Shopping & Delivery Scams",
    description: "Fake online stores and delivery frauds take your payment and never deliver the product.",
    howItWorks: "Scammy ads on social media offer huge discounts. You pay via UPI or bank transfer, but the product never arrives — or you receive a fake or empty parcel. There is no customer support to complain to.",
    warningSigns: [
      "Prices far below market rate (e.g., a new phone for 40% off)",
      "Payment only accepted through personal UPI IDs or bank transfers",
      "No return or refund policy, and no working customer support",
      "The 'store' was discovered through a social media ad"
    ],
    example: "iPhone 15 only ₹24,999! Limited stock. Pay now via UPI to confirm your order.",
    whatToDo: [
      "Buy from well-known platforms and verified sellers.",
      "Prefer cash on delivery or secure checkout methods.",
      "Check independent reviews before paying for anything."
    ]
  },
  {
    id: "digital-arrest-impersonation",
    title: "Digital Arrest & Fake Police Scams",
    description: "Callers impersonate police or customs officials, claim you are under 'digital arrest', and demand money to resolve the case.",
    howItWorks: "You receive a call or video call saying a parcel in your name contains drugs or your identity is linked to a crime. They keep you on the call, show fake police backdrops, and demand a 'verification' transfer or payment to avoid arrest.",
    warningSigns: [
      "Anyone claiming to be police or customs demanding money over the phone",
      "Threats of immediate arrest or 'digital arrest'",
      "Being told to stay on a video call and not inform anyone"
    ],
    example: "This is Inspector Sharma from the Cyber Crime Cell. A parcel in your name contains illegal items. You are under digital arrest. Transfer ₹50,000 for verification.",
    whatToDo: [
      "Real authorities never demand money or conduct 'digital arrests' over the phone or video call.",
      "Hang up immediately and block the number.",
      "Report the call on cybercrime.gov.in or call 1930."
    ]
  },
  {
    id: "fake-customer-support",
    title: "Fake Customer Support",
    description: "Scammers pose as customer support for banks, couriers, or online platforms to steal OTPs or money.",
    howItWorks: "They either call you first claiming there is a problem with your account, or you search for a support number and land on a fake one. They ask for your OTP, request 'refund details', or ask you to install a screen-sharing app.",
    warningSigns: [
      "Support agents asking for your OTP, password, or card details",
      "Support numbers found through ads on search engines",
      "Requests to install screen-sharing or remote-access apps"
    ],
    example: "This is Amazon support. Your account was charged ₹12,000 by mistake. Share the OTP to process your refund.",
    whatToDo: [
      "Contact support only through the official app or website of the company.",
      "Never share OTPs or card details with anyone claiming to be support.",
      "No legitimate support team will ever ask you to install remote-access software."
    ]
  }
];
