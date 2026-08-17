
# Digital Safety Hub — AI Development Rules

## Project

Digital Safety Hub is a user-friendly cybersecurity web application that helps everyday users check suspicious messages, URLs, screenshots, and QR codes, understand potential risks, and receive actionable safety or recovery guidance.

The goal is to build a simple, reliable, polished hackathon MVP. Prefer working and understandable solutions over unnecessary complexity.

---

## Tech Stack

Current stack:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Base UI
- Nova preset
- lucide-react
- zod
- html5-qrcode

Additional libraries may be added when genuinely required for a feature.

Do not replace the existing stack, UI library, Base UI, or Nova preset without a strong technical reason.

---

## Project Structure

The project uses feature-oriented architecture.

app/
components/
features/
lib/
types/
config/
public/

Feature directories:

features/
├── scam-check/
├── url-analysis/
├── qr-scanner/
├── report-recovery/
├── safety-hub/
└── dashboard/

Keep feature-specific code inside its own feature directory.

Do not modify another feature's internal code unless absolutely necessary.

Do not duplicate functionality.

Put genuinely shared code in components/, lib/, or types/.

Coding Rules
Inspect existing code before modifying it.
Reuse existing components and utilities when possible.
Do not rewrite working code unnecessarily.
Keep changes limited to the requested task.
Use TypeScript properly.
Follow existing naming and styling conventions.
Do not create unnecessary abstractions.
Do not modify unrelated files.
Do not remove working functionality without a reason.
Dependencies
Prefer existing dependencies.
Do not install unnecessary packages.
Do not install multiple packages that solve the same problem.
Do not replace existing libraries without a clear reason.
Security

Treat all user input and external data as untrusted.

This includes:

URLs
Messages
Images
QR contents
Uploaded files
API responses

Rules:

Never expose API keys or secrets in client code.
Never commit secrets.
Use environment variables for secrets.
Never commit .env.local.
Validate user input.
Handle external API failures safely.
Never execute arbitrary user-provided content.
Avoid dangerouslySetInnerHTML unless absolutely necessary.
Never claim something is "100% safe."
Never fabricate security results or confidence scores.

Use honest results such as:

Safe / No obvious threat detected
Suspicious
High Risk
Unable to determine
AI / External APIs

When AI or security APIs are added:

Keep secret API calls server-side when appropriate.
Send only necessary user data.
Handle API failures and rate limits.
Validate external responses.
Clearly distinguish AI/heuristic analysis from verified security information.
Never pretend an API check happened when it did not.
UI/UX

The application should be:

Simple
Clean
Mobile-friendly
Accessible
Easy for non-technical users

Avoid unnecessary animations, technical jargon, and excessive UI complexity.

Always handle loading, error, empty, and success states where applicable.

Git

Use focused commits.

Examples:

feat: add scam check input
feat: add URL analysis
fix: handle invalid URL
refactor: simplify analysis service
chore: update dependencies
docs: update documentation

Before considering work complete:

npm run lint
npm run build

Also manually test the relevant feature.

AI Agent Rules

Before coding:

Read this file.
Inspect the existing implementation.
Understand the requested task.
Make the smallest reasonable change.

Do NOT:

Rewrite unrelated code.
Modify unrelated features.
Create duplicate components.
Install unnecessary dependencies.
Change the architecture without a reason.
Create fake functionality.
Create fake API responses.
Implement future features that were not requested.

If a shared architectural change is required, explain it before making broad changes.

Hackathon Rule

Build the simplest reliable solution that solves the problem.

Do not add features just because they sound impressive.

Do not prematurely implement authentication, databases, dashboards, analytics, deepfake detection, or other future functionality unless explicitly requested.