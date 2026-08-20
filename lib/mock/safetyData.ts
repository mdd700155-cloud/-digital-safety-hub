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
  },
  {
    id: "deepfake-ai-protection",
    title: "Deepfake & AI Voice Scams",
    description: "Fraudsters use AI-generated voices, face-swapped videos, and synthetic images to impersonate loved ones or officials and extort money.",
    howItWorks: "You receive an urgent call or voice note from someone who sounds exactly like your child, parent, or boss. They claim to be in an emergency — an accident, arrest, or hospital situation — and beg you to send money immediately before you can verify.",
    warningSigns: [
      "An unexpected call or voice message from a loved one asking for urgent money",
      "The caller says they can only communicate by voice note or a strange number",
      "Heavy pressure to send UPI, crypto, or cash before you can talk to anyone else",
      "A face on a video call that looks slightly unnatural or has inconsistent lighting/backgrounds"
    ],
    example: "Mom, I had a major accident on the highway. The police are here and I need ₹80,000 for surgery right now. Don't call Dad, just send it to this UPI ID — I'll explain later.",
    whatToDo: [
      "Never send money based solely on a voice call or message. End the call and verify using a trusted phone number you already have.",
      "Set up a secret safety word or code phrase with family members. Real emergency callers should be able to provide it.",
      "If you receive a suspicious video of a loved one, ask them to make a specific gesture or write a specific word to prove it is live."
    ]
  },
  {
    id: "money-scam-recovery-steps",
    title: "After Being Scammed: First Steps",
    description: "A quick guide on what to do immediately after you realize you have lost money or shared credentials with a scammer.",
    howItWorks: "Time is critical after a scam. Acting within the first hour can often freeze payments or recover funds before the scammer withdraws them. Most people waste time panicking or hiding the incident — use this checklist instead.",
    warningSigns: [
      "You just sent money or UPI and realize the recipient was a fraud",
      "You shared an OTP, PIN, or password with someone who contacted you",
      "A caller is threatening you with arrest or 'digital arrest' if you don't pay"
    ],
    example: "I just paid ₹25,000 for a fake KYC update. The website looked exactly like my bank's and now the page is gone.",
    whatToDo: [
      "Call your bank or payment provider's OFFICIAL fraud helpline immediately and ask to freeze or reverse the transaction.",
      "Report the incident on cybercrime.gov.in and — for financial fraud — call 1930 within the first hour.",
      "Change all passwords and PINs for any account that may be affected, especially if credentials were shared.",
      "Do not feel ashamed or hide it. Fast reporting is the biggest factor in whether funds can be recovered."
    ]
  },
  {
    id: "sim-swap-mobile-fraud",
    title: "SIM Swap & Mobile Fraud",
    description: "Fraudsters get a duplicate SIM issued in your name to hijack all your SMS, calls, OTPs, and access to your bank and UPI apps.",
    howItWorks: "The scammer first collects your personal details (name, phone, Aadhaar number) from social media or a data leak. They then impersonate you at a mobile store or online and request a SIM replacement. When your phone suddenly loses signal, your new SIM is in their hands — and so are all your incoming OTPs for banking, UPI, and social media.",
    warningSigns: [
      "Your phone suddenly shows 'No signal' or 'SIM not registered' for hours in an area with normal coverage",
      "You receive SMSes saying 'Your SIM replacement request has been processed' or 'Welcome to the network' when you did not request one",
      "Your UPI or bank app logs you out, or you receive OTPs for transactions you didn't initiate"
    ],
    example: "My SIM stopped working at 11 AM. By noon, ₹45,000 was gone from my UPI and savings account through three transactions I never approved.",
    whatToDo: [
      "If you lose signal suddenly, call your mobile operator FROM ANOTHER NUMBER immediately and freeze or lock your SIM.",
      "Never share an OTP that says 'for SIM verification' or 'port request' — no genuine process requires you to read it out.",
      "Set up SIM PIN and app lock on your phone, and use authenticator-app 2FA for banks instead of SMS 2FA whenever possible."
    ]
  }
];
