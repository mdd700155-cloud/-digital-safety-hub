# Digital Safety Hub 🛡️

Digital Safety Hub is a user-friendly cybersecurity platform that helps people check suspicious links, messages, screenshots, QR codes, and voice recordings, detect AI-generated deepfake voices, understand why something may be dangerous, and take the right steps if they have been scammed.

The goal is simple:

> **Check → Understand → Protect → Recover**

---

## 🚀 What Can Digital Safety Hub Do?

### 🔍 Scam Check

Users can check:

- URLs / website links
- Suspicious messages
- Screenshots
- QR codes
- Voice recordings (scam call analysis)

The system analyzes the submitted content and gives a simple result:

- 🟢 **Safe** — No significant threat indicators were found.
- 🟡 **Suspicious** — Some indicators require caution.
- 🔴 **High Risk** — Strong evidence of a potential threat was found.

The result also explains **why** something was flagged and what the user should do next.

---

### 🎙️ Deepfake / Synthetic Voice Detection

Users can upload or record audio to check whether a voice is real or AI-generated.

The system analyzes the audio and provides:

- 🟢 **Likely Authentic** — Voice characteristics are consistent with natural human speech.
- 🟡 **Uncertain** — Mixed signals; could be real or synthetic.
- 🔴 **Likely Synthetic** — Multiple characteristics indicate AI-generated or cloned speech.

The result includes a synthetic probability percentage, detailed feature breakdown, AI reasoning, and actionable recommendations.

---

# 🔐 How Does Scam Check Work?

Scam Check does **not rely on a single AI model**.

For URLs, Digital Safety Hub uses multiple layers of analysis.

```text
                User enters URL
                       │
                       ▼
                URL Normalization
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Security        ML        Threat
        Rules       Classifier  Intelligence
          │            │            │
          │            │         URLhaus
          │            │
          └────────────┼────────────┘
                       ▼
                    Gemini
                       │
                       ▼
                 Risk Aggregator
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
           SAFE    SUSPICIOUS  HIGH RISK
```

## 🎙️ How Does Deepfake Detection Work?

Deepfake detection uses a **dual-layer approach** for accuracy:

```text
              User uploads / records audio
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
    Client-Side Analysis       Gemini AI Analysis
    (Web Audio API)            (Server-Side)
           │                         │
    ┌──────┴──────┐          ┌───────┴───────┐
    │ Spectral    │          │ Prosody &     │
    │ Flatness    │          │ Intonation    │
    │ Pitch       │          │ Breathing     │
    │ Regularity  │          │ Patterns      │
    │ Zero-Cross  │          │ Speaker       │
    │ Rate        │          │ Consistency   │
    │ Amplitude   │          │ Background    │
    │ Dynamics    │          │ Noise         │
    │ Spectral    │          │ Word          │
    │ Contrast    │          │ Transitions   │
    │ HNR         │          │ Audio         │
    │ Formants    │          │ Artifacts     │
    └──────┬──────┘          └───────┬───────┘
           │                         │
           └────────────┬────────────┘
                        ▼
              Risk Aggregator
          (65% AI + 35% Features)
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
       LIKELY       UNCERTAIN    LIKELY
      AUTHENTIC                 SYNTHETIC
```

**Layer 1 — Client-Side Audio Features:**
Extracts 8 audio characteristics using the Web Audio API: spectral flatness, pitch regularity, zero-crossing rate, amplitude dynamics, spectral contrast, harmonic-to-noise ratio, temporal micro-variation, and formant consistency.

**Layer 2 — Gemini AI Analysis:**
Sends audio to Google Gemini for AI-powered assessment of prosody, breathing patterns, speaker consistency, background noise naturalness, and word transitions.

Both layers are aggregated into a final result. Neither layer alone can make a definitive determination — they must corroborate each other.

---

### 🚨 Report & Recover

If someone has already been scammed, Digital Safety Hub provides a guided recovery process.

It can help users:

- Identify the type of incident
- Record important details
- Prepare an incident summary
- Preserve useful evidence
- Find official reporting resources
- Access important emergency contacts and government resources

The application does **not** automatically submit a complaint on behalf of the user.

---

### 📚 Safety Hub

The Safety Hub provides simple educational content about common online threats such as:

- Phishing
- UPI and payment scams
- Fake websites
- Account takeover
- OTP scams
- Social engineering
- Other common cyber threats

The goal is to help users understand scams instead of simply warning them about them.

---

