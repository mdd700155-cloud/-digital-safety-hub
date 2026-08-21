/**
 * Risk Aggregator — Central Decision Engine
 *
 * Philosophy:
 *   - Strong trusted evidence (URLhaus match, STRONG-weight signals) → HIGH_RISK
 *   - Multiple meaningful independent signals (MODERATE) → SUSPICIOUS
 *   - Only weak/common signals alone → SAFE (no obvious threat)
 *   - Gemini alone cannot declare HIGH_RISK without corroborating heuristic evidence
 *   - Confidence reflects quality and agreement of evidence, not Gemini's own self-report
 */

import { RiskLevel, ConfidenceLevel, ThreatIntel, AnalysisResult } from "@/types/analysis";
import { UrlSignal } from "./urlAnalyzer";

const FALLBACK_STRINGS: Record<string, { noThreat: string; minorPatterns: string; proceedNormal: string; neverShare: string; doNotClick: string; contactBank: string; reportIncident: string; analysisComplete: string }> = {
  en: {
    noThreat: "No obvious threat indicators detected. This does not guarantee the content is safe.",
    minorPatterns: "We detected some minor patterns, but no strong threat evidence. Proceed with caution.",
    proceedNormal: "Proceed with normal caution.",
    neverShare: "Never share passwords or OTPs with anyone.",
    doNotClick: "Do not click links or provide personal information.",
    contactBank: "If you have already shared sensitive data, contact your bank immediately.",
    reportIncident: "Report the incident at cybercrime.gov.in or call 1930.",
    analysisComplete: "Analysis complete.",
  },
  hi: {
    noThreat: "कोई स्पष्ट खतरे के संकेत नहीं मिले। इसका मतलब यह नहीं है कि सामग्री सुरक्षित है।",
    minorPatterns: "कुछ मामूली पैटर्न मिले, लेकिन कोई मजबूत खतरे का प्रमाण नहीं। सावधानी से आगे बढ़ें।",
    proceedNormal: "सामान्य सावधानी बरतें।",
    neverShare: "कभी भी किसी को पासवर्ड या OTP साझा न करें।",
    doNotClick: "लिंक पर क्लिक न करें या व्यक्तिगत जानकारी साझा न करें।",
    contactBank: "यदि आपने पहले ही संवेदनशील डेटा साझा कर दिया है, तो तुरंत अपने बैंक से संपर्क करें।",
    reportIncident: "cybercrime.gov.in पर रिपोर्ट करें या 1930 पर कॉल करें।",
    analysisComplete: "विश्लेषण पूरा।",
  },
  bn: {
    noThreat: "কোনো স্পষ্ট হুমকির ইঙ্গিত পাওয়া যায়নি। এর মানে এই নয় যে বিষয়বস্তু নিরাপদ।",
    minorPatterns: "কিছু সামান্য প্যাটার্ন পাওয়া গেছে, কিন্তু কোনো শক্তিশালী হুমকির প্রমাণ নেই। সতর্কতাবশত এগিয়ে যান।",
    proceedNormal: "সাধারণ সতর্কতা অবলম্বন করুন।",
    neverShare: "কারো সাথে পাসওয়ার্ড বা OTP শেয়ার করবেন না।",
    doNotClick: "লিংকে ক্লিক করবেন না বা ব্যক্তিগত তথ্য দেবেন না।",
    contactBank: "আপনি ইতিমধ্যে সংবেদনশীল তথ্য শেয়ার করে থাকলে, অবিলম্বে আপনার ব্যাংকের সাথে যোগাযোগ করুন।",
    reportIncident: "cybercrime.gov.in-এ রিপোর্ট করুন বা 1930-এ কল করুন।",
    analysisComplete: "বিশ্লেষণ সম্পূর্ণ।",
  },
  ta: {
    noThreat: "வெளிப்படையான அச்சுறுத்தல் குறிகள் எதுவும் கண்டறியப்படவில்லை. இது உள்ளடக்கம் பாதுகாப்பானது என்று அர்த்தமல்ல.",
    minorPatterns: "சில சிறிய முறைகள் கண்டறியப்பட்டன, ஆனால் வலுவான அச்சுறுத்தல் ஆதாரம் இல்லை. எச்சரிக்கையுடன் தொடரவும்.",
    proceedNormal: "சாதாரண எச்சரிக்கையுடன் செல்லவும்.",
    neverShare: "யாருடனும் கடவுச்சொல் அல்லது OTP பகிர வேண்டாம்.",
    doNotClick: "இணைப்புகளைக் கிளிக் செய்யவோ அல்லது தனிப்பட்ட தகவலை வழங்கவோ செய்யாதீர்கள்.",
    contactBank: "நீங்கள் ஏற்கனவே உணர்திறன் தரவைப் பகிர்ந்திருந்தால், உடனடியாக உங்கள் வங்கியைத் தொடர்பு கொள்ளுங்கள்.",
    reportIncident: "cybercrime.gov.in இல் புகாரளிக்கவும் அல்லது 1930 என்ற எண்ணில் அழைக்கவும்.",
    analysisComplete: "பகுப்பாய்வு முடிந்தது.",
  },
  te: {
    noThreat: "స్పష్టమైన ముప్పు సూచనలు కనుగొనబడలేదు. దీని అర్థం కంటెంట్ సురక్షితం అని కాదు.",
    minorPatterns: "కొన్ని చిన్న నమూనాలు కనుగొనబడ్డాయి, కానీ బలమైన ముప్పు ఆధారం లేదు. జాగ్రత్తగా ముందుకు సాగండి.",
    proceedNormal: "సాధారణ జాగ్రత్తలు తీసుకోండి.",
    neverShare: "ఎవరితోనూ పాస్‌వర్డ్ లేదా OTP షేర్ చేయవద్దు.",
    doNotClick: "లింక్‌లపై క్లిక్ చేయవద్దు లేదా వ్యక్తిగత సమాచారం అందించవద్దు.",
    contactBank: "మీరు ఇప్పటికే సున్నితమైన డేటాను షేర్ చేస్తే, వెంటనే మీ బ్యాంక్‌ను సంప్రదించండి.",
    reportIncident: "cybercrime.gov.in లో నివేదించండి లేదా 1930 కు కాల్ చేయండి.",
    analysisComplete: "విశ్లేషణ పూర్తయింది.",
  },
  mr: {
    noThreat: "कोणतेही स्पष्ट धोका संकेत आढळले नाहीत. याचा अर्थ सामग्री सुरक्षित आहे असे नाही.",
    minorPatterns: "काही सामान्य नमुने आढळले, परंतु मजबूत धोका पुरावा नाही. सावधानीने पुढे जा.",
    proceedNormal: "सामान्य सावधानी बाळगा.",
    neverShare: "कोणालाही पासवर्ड किंवा OTP शेअर करू नका.",
    doNotClick: "लिंकवर क्लिक करू नका किंवा वैयक्तिक माहिती देऊ नका.",
    contactBank: "तुम्ही आधीच संवेदनशील माहिती शेअर केली असल्यास, लगेच तुमच्या बँकेशी संपर्क साधा.",
    reportIncident: "cybercrime.gov.in वर तक्रार नोंदवा किंवा 1930 वर कॉल करा.",
    analysisComplete: "विश्लेषण पूर्ण.",
  },
  gu: {
    noThreat: "કોઈ સ્પષ્ટ ખતરાના સંકેતો મળ્યા નથી. આનો અર્થ એ નથી કે સામગ્રી સુરક્ષિત છે.",
    minorPatterns: "કેટલાક નાના પેટર્ન મળ્યા, પરંતુ મજબૂત ખતરાના પુરાવા નથી. સાવધાનીપૂર્વક આગળ વધો.",
    proceedNormal: "સામાન્ય સાવધાની રાખો.",
    neverShare: "કોઈની સાથે પાસવર્ડ અથવા OTP શેર કરશો નહીં.",
    doNotClick: "લિંક પર ક્લિક કરશો નહીં અથવા વ્યક્તિગત માહિતી આપશો નહીં.",
    contactBank: "તમે પહેલાથી સંવેદનશીલ ડેટા શેર કર્યો હોય, તો તરત જ તમારા બેંકનો સંપર્ક કરો.",
    reportIncident: "cybercrime.gov.in પર ફરિયાદ નોંધો અથવા 1930 પર કૉલ કરો.",
    analysisComplete: "વિશ્લેષણ પૂર્ણ.",
  },
  kn: {
    noThreat: "ಯಾವುದೇ ಸ್ಪಷ್ಟ ಬೆದರಿಕೆ ಸೂಚನೆಗಳು ಪತ್ತೆಯಾಗಿಲ್ಲ. ಇದರ ಅರ್ಥ ವಿಷಯವು ಸುರಕ್ಷಿತ ಎಂದಲ್ಲ.",
    minorPatterns: "ಕೆಲವು ಸಣ್ಣ ಮಾದರಿಗಳು ಕಂಡುಬಂದಿವೆ, ಆದರೆ ಬಲವಾದ ಬೆದರಿಕೆ ಪುರಾವೆ ಇಲ್ಲ. ಎಚ್ಚರಿಕೆಯಿಂದ ಮುಂದುವರಿಯಿರಿ.",
    proceedNormal: "ಸಾಮಾನ್ಯ ಎಚ್ಚರಿಕೆ ವಹಿಸಿ.",
    neverShare: "ಯಾರೊಂದಿಗೂ ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ OTP ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
    doNotClick: "ಲಿಂಕ್‌ಗಳನ್ನು ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ ಅಥವಾ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ ನೀಡಬೇಡಿ.",
    contactBank: "ನೀವು ಈಗಾಗಲೇ ಸೂಕ್ಷ್ಮ ಡೇಟಾವನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದರೆ, ತಕ್ಷಣ ನಿಮ್ಮ ಬ್ಯಾಂಕ್‌ನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    reportIncident: "cybercrime.gov.in ನಲ್ಲಿ ವರದಿ ಮಾಡಿ ಅಥವಾ 1930 ಗೆ ಕರೆ ಮಾಡಿ.",
    analysisComplete: "ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ.",
  },
  ml: {
    noThreat: "വ്യക്തമായ ഭീഷണി സൂചനകൾ കണ്ടെത്തിയിട്ടില്ല. ഇതിനർത്ഥം ഉള്ളടക്കം സുരക്ഷിതമാണെന്നല്ല.",
    minorPatterns: "ചില ചെറിയ പാറ്റേണുകൾ കണ്ടെത്തി, പക്ഷേ ശക്തമായ ഭീഷണി തെളിവില്ല. ശ്രദ്ധയോടെ മുന്നോട്ട് പോകുക.",
    proceedNormal: "സാധാരണ ശ്രദ്ധ പുലർത്തുക.",
    neverShare: "ആർക്കും പാസ്‌വേർഡോ OTP യും പങ്കിടരുത്.",
    doNotClick: "ലിങ്കുകളിൽ ക്ലിക്ക് ചെയ്യുകയോ വ്യക്തിഗത വിവരങ്ങൾ നൽകുകയോ ചെയ്യരുത്.",
    contactBank: "നിങ്ങൾ ഇതിനകം സെൻസിറ്റീവ് ഡാറ്റ പങ്കിട്ടിട്ടുണ്ടെങ്കിൽ, ഉടൻ നിങ്ങളുടെ ബാങ്കുമായി ബന്ധപ്പെടുക.",
    reportIncident: "cybercrime.gov.in-ൽ റിപ്പോർട്ട് ചെയ്യുക അല്ലെങ്കിൽ 1930-ൽ വിളിക്കുക.",
    analysisComplete: "വിശകലനം പൂർത്തിയായി.",
  },
  pa: {
    noThreat: "ਕੋਈ ਸਪੱਸ਼ਟ ਖ਼ਤਰੇ ਦੇ ਸੰਕੇਤ ਨਹੀਂ ਮਿਲੇ। ਇਸ ਦਾ ਮਤਲਬ ਇਹ ਨਹੀਂ ਕਿ ਸਮੱਗਰੀ ਸੁਰੱਖਿਅਤ ਹੈ।",
    minorPatterns: "ਕੁਝ ਮਾਮੂਲੀ ਪੈਟਰਨ ਮਿਲੇ, ਪਰ ਕੋਈ ਮਜ਼ਬੂਤ ਖ਼ਤਰੇ ਦਾ ਸਬੂਤ ਨਹੀਂ। ਸਾਵਧਾਨੀ ਨਾਲ ਅੱਗੇ ਵਧੋ।",
    proceedNormal: "ਆਮ ਸਾਵਧਾਨੀ ਬਰਤੋ।",
    neverShare: "ਕਿਸੇ ਨਾਲ ਵੀ ਪਾਸਵਰਡ ਜਾਂ OTP ਸਾਂਝਾ ਨਾ ਕਰੋ।",
    doNotClick: "ਲਿੰਕਾਂ 'ਤੇ ਕਲਿੱਕ ਨਾ ਕਰੋ ਜਾਂ ਨਿੱਜੀ ਜਾਣਕਾਰੀ ਨਾ ਦਿਓ।",
    contactBank: "ਜੇ ਤੁਸੀਂ ਪਹਿਲਾਂ ਹੀ ਸੰਵੇਦਨਸ਼ੀਲ ਡੇਟਾ ਸਾਂਝਾ ਕੀਤਾ ਹੈ, ਤਾਂ ਤੁਰੰਤ ਆਪਣੇ ਬੈਂਕ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
    reportIncident: "cybercrime.gov.in 'ਤੇ ਰਿਪੋਰਟ ਕਰੋ ਜਾਂ 1930 'ਤੇ ਕਾਲ ਕਰੋ।",
    analysisComplete: "ਵਿਸ਼ਲੇਸ਼ਣ ਪੂਰਾ।",
  },
  or: {
    noThreat: "କୌଣସି ସ୍ପଷ୍ଟ ବିପଦ ସୂଚନା ମିଳିଲା ନାହିଁ। ଏହାର ଅର୍ଥ ସାମଗ୍ରୀ ସୁରକ୍ଷିତ ଅଟେ ନାହିଁ।",
    minorPatterns: "କିଛି ସାମାନ୍ୟ ଢାଞ୍ଚା ମିଳିଲା, କିନ୍ତୁ ଦୃଢ଼ ବିପଦ ପ୍ରମାଣ ନାହିଁ। ସାବଧାନରେ ଆଗକୁ ଯାଆନ୍ତୁ।",
    proceedNormal: "ସାଧାରଣ ସାବଧାନତା ଅବଲମ୍ବନ କରନ୍ତୁ।",
    neverShare: "କାହା ସହ ମଧ୍ୟ ପାସୱାର୍ଡ କିମ୍ବା OTP ସେୟାର କରନ୍ତୁ ନାହିଁ।",
    doNotClick: "ଲିଙ୍କରେ କ୍ଲିକ୍ କରନ୍ତୁ ନାହିଁ କିମ୍ବା ବ୍ୟକ୍ତିଗତ ସୂଚନା ଦିଅନ୍ତୁ ନାହିଁ।",
    contactBank: "ଆପଣ ପୂର୍ବରୁ ସମ୍ବେଦନଶୀଳ ତଥ୍ୟ ସେୟାର କରିଥିଲେ, ତୁରନ୍ତ ଆପଣଙ୍କ ବ୍ୟାଙ୍କକୁ ଯୋଗାଯୋଗ କରନ୍ତୁ।",
    reportIncident: "cybercrime.gov.in ରେ ରିପୋର୍ଟ କରନ୍ତୁ କିମ୍ବା 1930 ରେ କଲ୍ କରନ୍ତୁ।",
    analysisComplete: "ବିଶ୍ଳେଷଣ ସମ୍ପୂର୍ଣ୍ଣ।",
  },
};

interface AggregationInput {
  heuristicSignals: string[];       // Simple string list for display
  weightedSignals?: UrlSignal[];     // Structured weighted signals from URL analyzer
  threatIntel?: ThreatIntel;
  geminiRiskLevel?: RiskLevel;
  geminiSignals: string[];
  geminiRecommendations: string[];
  geminiSummary: string;
  language?: string;                // Output language code (e.g. "hi", "bn", "ta")
}

function computeHeuristicScore(weightedSignals: UrlSignal[], plainSignals: string[]): number {
  if (weightedSignals.length > 0) {
    // Use weighted scoring
    return weightedSignals.reduce((score, s) => {
      if (s.weight === "STRONG") return score + 3;
      if (s.weight === "MODERATE") return score + 2;
      return score + 0.5; // WEAK signals barely contribute
    }, 0);
  }
  // Fallback for message/screenshot plain signals
  return plainSignals.length * 1.5;
}

export function aggregateRisk(input: AggregationInput): AnalysisResult {
  const {
    heuristicSignals,
    weightedSignals = [],
    threatIntel,
    geminiRiskLevel,
    geminiSignals,
    geminiRecommendations,
    geminiSummary,
    language,
  } = input;

  let finalRiskLevel: RiskLevel = "SAFE";
  let confidence: ConfidenceLevel = "MEDIUM";

  const allSignals = [...heuristicSignals, ...geminiSignals].filter((v, i, a) => a.indexOf(v) === i);

  // ── TIER 1: Verified Threat Intelligence ─────────────────────────────
  if (threatIntel?.match) {
    finalRiskLevel = "HIGH_RISK";
    confidence = "HIGH";
  }
  // ── TIER 2: Strong Heuristic Evidence ────────────────────────────────
  else {
    const heuristicScore = computeHeuristicScore(weightedSignals, heuristicSignals);

    // Strong heuristic signals: HIGH_RISK only if Gemini agrees or score is very high
    const hasStrongHeuristic = weightedSignals.some((s) => s.weight === "STRONG");
    const hasManyModerate =
      weightedSignals.filter((s) => s.weight === "MODERATE").length >= 2;

    if (hasStrongHeuristic && geminiRiskLevel !== "SAFE") {
      // Strong heuristic + Gemini not clear → HIGH_RISK
      finalRiskLevel = "HIGH_RISK";
      confidence = "HIGH";
    } else if (hasStrongHeuristic) {
      // Strong heuristic but Gemini says safe — be conservative
      finalRiskLevel = "SUSPICIOUS";
      confidence = "MEDIUM";
    } else if (geminiRiskLevel === "HIGH_RISK") {
      // Gemini alone says HIGH_RISK — require meaningful heuristic corroboration
      if (heuristicScore >= 4) {
        finalRiskLevel = "HIGH_RISK";
        confidence = "MEDIUM";
      } else if (heuristicScore >= 1.5) {
        finalRiskLevel = "SUSPICIOUS";
        confidence = "MEDIUM";
      } else {
        // No heuristic corroboration — downgrade Gemini's strong claim
        finalRiskLevel = "SUSPICIOUS";
        confidence = "LOW";
      }
    } else if (geminiRiskLevel === "SUSPICIOUS") {
      if (hasManyModerate || heuristicScore >= 4) {
        finalRiskLevel = "SUSPICIOUS";
        confidence = "MEDIUM";
      } else if (heuristicScore >= 1.5) {
        finalRiskLevel = "SUSPICIOUS";
        confidence = "LOW";
      } else {
        // Only weak heuristics + Gemini is suspicious → inconclusive, lean safe
        finalRiskLevel = "SAFE";
        confidence = "LOW";
      }
    } else {
      // Gemini says SAFE
      if (heuristicScore >= 4) {
        // Many heuristic signals even though Gemini is okay — flag as suspicious
        finalRiskLevel = "SUSPICIOUS";
        confidence = "LOW";
      } else {
        finalRiskLevel = "SAFE";
        confidence = heuristicScore === 0 ? "HIGH" : "MEDIUM";
      }
    }
  }

  // ── Build the user-facing summary ─────────────────────────────────────
  const fb = FALLBACK_STRINGS[language ?? "en"] ?? FALLBACK_STRINGS.en;
  let summary = geminiSummary;
  if (finalRiskLevel === "SAFE") {
    // Ensure we don't claim "safe" outright — prefer honest "no obvious threat" phrasing
    if (!summary || summary.toLowerCase().includes("safe")) {
      summary =
        heuristicSignals.length === 0 && !threatIntel
          ? fb.noThreat
          : fb.minorPatterns;
    }
  }

  // Build ordered warning indicators: threat intel first, then strong, then moderate, then weak
  const orderedIndicators = [
    ...(threatIntel?.match
      ? [
          `⚠ URLhaus reports this URL as associated with malware distribution (source: URLhaus/abuse.ch)${
            threatIntel.url_status ? ` — status: ${threatIntel.url_status}` : ""
          }`,
        ]
      : []),
    ...allSignals,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const defaultRecommendations =
    finalRiskLevel === "SAFE"
      ? [fb.proceedNormal, fb.neverShare]
      : [
          fb.doNotClick,
          fb.contactBank,
          fb.reportIncident,
        ];

  return {
    level: finalRiskLevel,
    confidence,
    summary: summary || fb.analysisComplete,
    warningIndicators: orderedIndicators,
    recommendations: geminiRecommendations.length > 0 ? geminiRecommendations : defaultRecommendations,
    signals: heuristicSignals,
    threatIntel,
  };
}
