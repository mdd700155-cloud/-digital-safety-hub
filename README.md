# Digital Safety Hub 🛡️

Digital Safety Hub is a user-friendly cybersecurity platform that helps people check suspicious links, messages, screenshots, and QR codes, understand why something may be dangerous, and take the right steps if they have been scammed.

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

The system analyzes the submitted content and gives a simple result:

- 🟢 **Safe** — No significant threat indicators were found.
- 🟡 **Suspicious** — Some indicators require caution.
- 🔴 **High Risk** — Strong evidence of a potential threat was found.

The result also explains **why** something was flagged and what the user should do next.

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

