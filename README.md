# Digital Safety Hub 🛡️

Digital Safety Hub is a user-friendly cybersecurity platform that helps people check suspicious links, messages, screenshots, QR codes, emails, and voice recordings, detect AI-generated deepfake voices and images, understand why something may be dangerous, and take the right steps if they have been scammed.

The goal is simple:

> **Check → Understand → Protect → Recover**

---

## 🤖 AI Models & Detection Engines Used

Digital Safety Hub employs a multi-layered detection architecture combining large multimodal AI models, local machine learning classifiers, deterministic digital signal processing (DSP), computer vision heuristics, and real-time threat intelligence feeds.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                            DIGITAL SAFETY HUB ENGINES                       │
├───────────────────────┬──────────────────────────────┬───────────────────────┤
│ 1. AI & LLMs          │ 2. Local ML & Classifiers    │ 3. Signal Processing  │
│ • Gemini 3.6 Flash    │ • 17-Feature URL ML Model    │ • Web Audio API DSP   │
│ • Gemini 3.5 Flash    │   (Logistic Regression)      │ • CS-LBP Texture      │
│ • Multimodal Vision   │ • Heuristic Rules Engine     │ • Laplacian Variance  │
├───────────────────────┼──────────────────────────────┼───────────────────────┤
│ 4. Email Forensics    │ 5. Threat Intelligence       │ 6. Decision Engine    │
│ • SPF / DKIM / DMARC  │ • URLhaus (abuse.ch)         │ • Multi-Tier Risk     │
│ • RDAP Domain Age     │ • Live Malware API           │   Aggregator          │
│ • IP Geolocation/ASN  │                              │ • Trace Logger        │
└───────────────────────┴──────────────────────────────┴───────────────────────┘
```

---

## 🧠 Real Local ML Models & Mathematical Scoring

The platform avoids relying solely on cloud AI APIs by deploying **real local machine learning and deterministic DSP/CV models** that execute locally with zero latency, zero cloud dependency, and full mathematical explainability.

| Feature Area | Local Model / Algorithm | Training Dataset / Basis | Scoring Formula & Thresholds |
| :--- | :--- | :--- | :--- |
| **URL Phishing & Malicious Link Detection** | **Supervised Logistic Regression Classifier (v1.0)** | Trained on **235,795 real-world URLs** (165,056 train / 35,369 val / 35,370 test) | Sigmoid probability score $\sigma(z) \in [0, 1]$:<br>• $\ge 0.70$: `HIGH_RISK_SIGNAL`<br>• $0.50 - 0.69$: `SUSPICIOUS_SIGNAL`<br>• $< 0.50$: `LOW_RISK_SIGNAL` |
| **Synthetic Voice & Audio Deepfake Detection** | **Multi-Feature Acoustic DSP Model (Web Audio API)** | Fundamental frequency ($F_0$) Autocorrelation, Wiener Entropy, HNR | Suspicion-Weighted Ensemble Score ($0 - 100\%$):<br>• $\ge 60\%$: `LIKELY_SYNTHETIC`<br>• $30\% - 59\%$: `UNCERTAIN`<br>• $< 30\%$: `LIKELY_AUTHENTIC` |
| **Deepfake Face & Image Detection** | **Center-Symmetric Local Binary Pattern (CS-LBP) + Laplacian Variance** | Micro-texture entropy & second-order spatial luminance derivatives | Suspicion-Weighted Ensemble Score ($0 - 100\%$):<br>• $\ge 60\%$: `LIKELY_SYNTHETIC`<br>• $30\% - 59\%$: `UNCERTAIN`<br>• $< 30\%$: `LIKELY_AUTHENTIC` |
| **Central Risk Aggregator** | **Weighted Multi-Signal Linear Scoring Engine** | Tiered Evidence Matrix (Threat Intel > Heuristics > LLM) | Heuristic Score $\sum w_i$:<br>• $\text{STRONG} = 3.0$<br>• $\text{MODERATE} = 2.0$<br>• $\text{WEAK} = 0.5$ |

---

### Detailed Breakdown of Local Models & Scoring

#### 1. Local Machine Learning URL Classifier
- **Model Type**: Supervised Logistic Regression Classifier (`lib/security/models/ml_model.json`).
- **Trained Dataset**: 235,795 labeled benign and malicious URLs.
- **Mathematical Scoring Formula**:
  $$\text{Log-Odds } z = \beta_0 + \sum_{i=1}^{17} \beta_i \cdot x_i$$
  $$\text{Calibrated Score } P(\text{Malicious}) = \sigma(z) = \frac{1}{1 + e^{-z}}$$
- **17 Extracted Structural Features & Linear Weights ($\beta_i$)**:
  - `num_dots` ($\beta = +8.50$): High subdomain nesting is a strong indicator of phishing infrastructure.
  - `is_https` ($\beta = +15.92$): HTTPS presence baseline calibration.
  - `hostname_length` ($\beta = +2.98$): Unusually long hostnames mimicking legitimate brand names.
  - `hostname_entropy` ($\beta = +0.24$): High Shannon randomness indicating algorithmically generated domains (DGA).
  - `subdomain_count` ($\beta = -9.23$), `path_length` ($\beta = -8.47$), `url_length` ($\beta = -3.16$), `path_entropy` ($\beta = -0.92$), `num_digits` ($\beta = -0.94$), `num_hyphens` ($\beta = -0.89$), `num_query_params` ($\beta = -0.26$), `num_path_segments` ($\beta = -0.23$), `has_punycode` ($\beta = -0.07$), `has_at` ($\beta = -0.04$), `has_pct_encoding` ($\beta = -0.01$), `has_ip` ($\beta = +0.0003$), `unusual_port` ($\beta = -0.00004$).
  - `intercept` ($\beta_0 = +0.5007$).
- **Score Mapping & Action**:
  - **Score $\ge 0.70$** $\rightarrow$ `HIGH_RISK_SIGNAL` (Contributes `MODERATE` weight in Risk Aggregator).
  - **Score $0.50 - 0.69$** $\rightarrow$ `SUSPICIOUS_SIGNAL` (Contributes `WEAK` weight in Risk Aggregator).
  - **Score $< 0.50$** $\rightarrow$ `LOW_RISK_SIGNAL` (Clean structural baseline).
- **Complexity**: $O(N)$ for string feature extraction (where $N = \text{URL length}$), $O(1)$ for dot product ($\approx 0.1\text{ms}$ execution).
- **Why this model was chosen**:
  - **Zero Network Latency**: Executes synchronously in Node.js in $< 1\text{ms}$ without external API roundtrips.
  - **Full Explainability**: Linear coefficients provide transparent auditability on exactly which structural attributes caused the flag.
  - **Privacy**: Analyzes URL structures locally without making HTTP requests to the target server or leaking URLs to third-party crawlers.

---

#### 2. Local DSP Audio Deepfake Detection Pipeline
- **Model Type**: Multi-Parameter Digital Signal Processing (DSP) feature extraction running via the **Web Audio API**.
- **Acoustic Features Analyzed**:
  1. **Pitch Regularity ($F_0$ Autocorrelation)**: Measures Fundamental Frequency variance across frames to detect artificial pitch flatness.
  2. **Spectral Flatness (Wiener Entropy)**: Measures tone-to-noise ratio to detect vocoder synthesis artifacts.
  3. **Harmonic-to-Noise Ratio (HNR)**: Quantifies vocal fold periodicity relative to aspiration noise.
  4. **Zero-Crossing Rate (ZCR)**: Analyzes unvoiced consonant distribution and high-frequency spectral transitions.
  5. **Spectral Contrast**: Measures peak-to-valley energy dynamics across octave sub-bands.
  6. **Formant Consistency ($F_1, F_2$)**: Evaluates vocal tract acoustic resonance continuity.
- **Suspicion-Weighted Ensemble Formula**:
  When combined with Gemini AI analysis, the system applies a 75% suspicion bias:
  $$\text{Final Score} = \text{round}\Big(0.75 \times \max(S_{\text{AI}}, S_{\text{Local}}) + 0.25 \times \min(S_{\text{AI}}, S_{\text{Local}})\Big)$$
  *(If Gemini is unavailable, the local score is used directly with adjusted sensitivity thresholds).*
- **Complexity**: $O(M \cdot N \log N)$ where $M$ is the number of audio windows and $N$ is the FFT window size (2048 samples).
- **Why this model was chosen**:
  - **Edge Processing & Privacy**: Processes voice recordings locally in the user's browser, preventing private voice data from being sent to unnecessary servers.
  - **Compression Resilience**: Acoustic DSP features remain stable even after lossy VoIP and phone codec compression (Opus, AAC, AMR).

---

#### 3. Local Computer Vision Face & Image Deepfake Forensics
- **Model Type**: Client-Side Canvas Image Signal Processing (ISP).
- **Computer Vision Algorithms**:
  1. **Center-Symmetric Local Binary Patterns (CS-LBP)**: Analyzes micro-texture entropy across pixel neighborhoods to detect the unnatural skin oversmoothing and diffuse blur patterns typical of generative diffusion models.
  2. **Laplacian Variance Operator**: Computes second-order spatial derivatives to measure edge sharpness distribution and depth-of-field anomalies.
  3. **Color Channel Covariance**: Measures chromatic aberration consistency and RGB color alignment across facial boundaries.
- **Suspicion-Weighted Ensemble Formula**:
  $$\text{Final Score} = \text{round}\Big(0.75 \times \max(S_{\text{AI}}, S_{\text{Local}}) + 0.25 \times \min(S_{\text{AI}}, S_{\text{Local}})\Big)$$
- **Complexity**: $O(W \times H)$ single-pass pixel raster scan over the image dimensions in $< 50\text{ms}$.
- **Why this model was chosen**:
  - **Instant Browser Feedback**: Runs in real-time in HTML5 canvas without requiring heavy multi-gigabyte neural network models on the client.
  - **Direct Mathematical Capture of Diffusion Flaws**: Captures spatial frequency inconsistencies that human eyes often miss.

---

#### 4. Central Risk Aggregator (Multi-Tier Decision Matrix)
- **Model Type**: Tiered Bayesian-inspired rule and scoring aggregator (`lib/security/aggregator.ts`).
- **Mathematical Scoring Formula**:
  $$\text{Heuristic Score} = \sum_{s \in \text{Signals}} \text{Weight}(s)$$
  $$\text{Weight}(\text{STRONG}) = 3.0, \quad \text{Weight}(\text{MODERATE}) = 2.0, \quad \text{Weight}(\text{WEAK}) = 0.5$$
- **Decision Hierarchy**:
  - **Tier 1 (Verified Threat Intel Match)**: If URLhaus matches $\rightarrow$ `HIGH_RISK` (High Confidence).
  - **Tier 2 (Corroborated Structural Signals)**: If $\text{STRONG} \ge 1$ and Gemini $\ne \text{SAFE}$ $\rightarrow$ `HIGH_RISK` (High Confidence).
  - **Tier 3 (AI Corroboration Guardrail)**: If Gemini alone claims `HIGH_RISK` but $\text{Heuristic Score} < 4.0$, it is **downgraded** to `SUSPICIOUS` to prevent false positives.
- **Complexity**: $O(S)$ where $S$ is signal count ($< 0.1\text{ms}$).
- **Why this model was chosen**:
  - **Prevents LLM Hallucinations**: Ensures generative AI models cannot make high-risk determinations without corroborating deterministic evidence.

---

### 5. Google Gemini Multimodal Generative AI
- **Models Used**: `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-flash-latest` (with automatic failover retry architecture).
- **Core Applications**:
  - **Contextual Scam Analysis**: Evaluates conversational nuance, psychological urgency, social engineering tactics, impersonation of banks/government bodies, and fraudulent OTP/payment requests.
  - **Multimodal Screenshot Forensics**: Vision-based text extraction and visual anomaly detection for credential harvesting pages, fake banking UIs, and QR phishing.
  - **Synthetic Voice Forensics**: Evaluates audio recordings for natural prosody, breathing patterns, biological vocal markers, vocoder artifacts, and background noise realism.
  - **Deepfake Face & Image Forensics**: Evaluates corneal catchlights (pupil reflection symmetry), skin micro-texture, hair edge blending, and non-Euclidean background hallucinations.
- **Complexity**: Time $O(T + V)$ (sub-second bounded network I/O $\approx 500\text{ms}-1.2\text{s}$), Space $O(1)$ client memory.
- **Why this model was chosen**:
  - **Sub-Second Latency & Low Cost**: The Flash line provides near-instant responses with high throughput compared to heavyweight reasoning models.
  - **Zero-Day Scam Generalization**: Understands evolving psychological tricks without requiring daily dataset retraining.

---

### 6. Email Forensics & Protocol Verification Engine
- **Engines**:
  - **RFC 2822 / 5322 Parser**: Extracts headers, `From`, `Return-Path`, and unrolls the entire `Received` MTA transit chain.
  - **SPF Verification (RFC 7208)**: Direct DNS TXT queries against the sender domain to verify originating IP authorization.
  - **DKIM (RFC 6376) & DMARC (RFC 7489)**: Checks cryptographic signature validity and `_dmarc.<domain>` alignment policies (`p=reject`, `p=quarantine`).
  - **RDAP Domain Lifecycle Engine**: ICANN JSON-over-HTTP bootstrap query to calculate domain age and flag newly registered domains (<30 days old).
  - **IP Geolocation & ISP Network Resolution**: Originating MTA IP resolution to identify sender country, coordinates, and autonomous system (ISP/Hosting provider).
  - **SMTP Relay Path Builder**: Reconstructs chronological hop-by-hop message delivery path.
- **Complexity**: Time $O(L)$ header parsing + concurrent $O(1)$ network DNS/RDAP lookups ($\approx 100\text{ms}-400\text{ms}$), Space $O(L)$.
- **Why this model was chosen**:
  - **Cryptographic Ground Truth**: SPF, DKIM, and DMARC provide mathematical certainty regarding email spoofing and domain forgery without guessing.

---

### 7. Threat Intelligence Feed (URLhaus)
- **Architecture**: Real-time HTTP API integration with abuse.ch's URLhaus database.
- **Complexity**: Time $O(1)$ query lookup with a strict 5-second timeout and graceful fail-open fallback, Space $O(1)$ memory.
- **Why this model was chosen**:
  - **Verified Malware Attribution**: Offers active, verified threat intelligence on live malware distribution sites, ransomware C2 servers, and banking Trojans.

---

## 🚀 Key Features

### 🔍 Unified Scam Check
Users can paste text, links, or raw email headers, upload screenshots or `.eml` files, or scan QR codes in a single unified interface.
- 🟢 **Safe / No Obvious Threat** — No significant threat indicators detected.
- 🟡 **Suspicious** — Indicators found; exercise caution.
- 🔴 **High Risk** — Strong evidence of malicious activity detected.

### 📧 Email Forensics
Upload `.eml` files or paste raw email headers to get a full forensic breakdown: SPF/DKIM/DMARC authentication checks, sender IP geolocation, domain age verification via RDAP, and SMTP relay path reconstruction.

### 🎙️ Synthetic Voice Detection
Upload or record audio to detect whether a voice is authentic or generated by an AI clone. Uses multi-feature acoustic DSP analysis (pitch regularity, spectral flatness, HNR, ZCR, spectral contrast, formant consistency) combined with Gemini AI for a suspicion-weighted ensemble score.

### 🖼️ Deepfake Face & Image Detection
Upload portrait photos or face images to analyze for synthetic generation, facial manipulation, or diffusion artifacts. Uses CS-LBP micro-texture analysis, Laplacian variance, and color channel covariance combined with Gemini AI multimodal vision.

### 🚨 Report & Recover
Guided step-by-step assistance for scam victims, including evidence preservation checklists, incident summary generation, and direct links to official reporting portals (e.g. cybercrime.gov.in / 1930).

### 📚 Safety Hub
Interactive educational guides covering common scam patterns, phishing techniques, and digital safety best practices to help users recognize emerging threats.

### 🌐 ScamWatch Community Feed
Community-reported scam trends powered by Supabase. Users can submit and browse real scam reports to help others recognize the same patterns.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Base UI / Nova Preset
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Validation**: Zod
- **QR Scanner**: html5-qrcode
- **AI SDK**: Google Gen AI SDK (`@google/genai`)
- **Database**: Supabase (community ScamWatch reports)

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Environment Variables
Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
app/
├── page.tsx              # Home page with hero, stats, and embedded scam checker
├── check/                # Scam Check page
├── report/               # Report & Recover page
├── learn/                # Safety Hub / Education page
├── scamwatch/            # ScamWatch community feed (+ ReportScamForm)
└── api/
    ├── analyze/              # General analysis endpoint (text, URL, email, screenshot)
    ├── analyze/voice/        # Voice scam analysis endpoint (multipart audio)
    ├── analyze/deepfake/     # Audio deepfake detection endpoint
    └── analyze/deepfake-image/  # Image deepfake detection endpoint
components/
├── layout/               # Navbar, Footer, PageContainer, PageHeader
└── ui/                   # shadcn/ui primitives
features/
├── scam-check/           # ScamChecker, QrScanner, ResultDisplay, AnalysisLoader
├── voice-analysis/       # UnifiedAudioAnalyzer, recorder, uploader, preview,
│                           transcript, fingerprint, risk result, evidence export
├── deepfake-detection/   # DeepfakeImageDetector, DeepfakeImageResult, DeepfakeResult
├── report-recovery/      # RecoveryWizard, OfficialResources, FirstSteps
├── safety-hub/           # EducationDashboard
├── url-analysis/
├── qr-scanner/
└── dashboard/
lib/
├── ai/                   # Gemini integration (text + multimodal image analysis)
├── email/                # Email forensics (headerParser, authChecker, geoIp,
│                           domainAge, relayPath, emailAnalyzer)
├── security/             # aggregator, urlAnalyzer, messageAnalyzer, urlhaus,
│                           mlUrlClassifier, ML model weights
├── voice/                # Voice transcription, voice signals, deepfake detection
├── image/                # Deepfake image detection (client features + server analyzer)
├── orchestrator/         # Unified analysis orchestrator and pipeline types
├── validation/           # Zod input validation schemas
├── mock/                 # Recovery data (20 categories), safety guides (9 guides)
├── helpers/              # Evidence export utilities
├── utils/                # Shared utility functions
└── supabase.ts           # Supabase client for ScamWatch
types/                    # Shared TypeScript type definitions
config/                   # Application configuration
public/                   # Static assets
tools/
└── ml/                   # ML model training tools
```

---

## 📄 Route Map

| Route | Description |
| :--- | :--- |
| `/` | Home page with hero section and embedded scam checker |
| `/check` | Full scam check page (General, Audio, Deepfake Image tabs) |
| `/report` | Report & Recover wizard for scam victims |
| `/learn` | Safety Hub — educational guides and scam pattern recognition |
| `/scamwatch` | Community ScamWatch feed — browse and submit scam reports |
| `/api/analyze` | POST — General analysis (text, URL, email, screenshot) |
| `/api/analyze/voice` | POST — Voice scam analysis (multipart audio upload) |
| `/api/analyze/deepfake` | POST — Audio deepfake detection |
| `/api/analyze/deepfake-image` | POST — Image deepfake detection |
