# Unphishable · The Manipulation Decoder

A local message-analysis application that identifies potential psychological pressure, cites the exact language behind its findings, and suggests safer next steps. Built from scratch in this directory for the Manipulation Decoder hackathon brief. No Git repository, remote repository, or deployment is created by the application.

## Run locally

Use Node.js **22.12 or newer** (tested with Node 26.7) and npm. From the project directory:

```bash
cd /home/adityadugar/Documents/Projects/unphishable
npm ci
npm run dev
```

Open **http://127.0.0.1:4173**. This runs the API and Vite frontend together. Frontend source is transformed on request; refresh after editing. Restart after changing server code or environment configuration.

For the production frontend build, served by the same local API:

```bash
npm run build
npm start
```

Stop with Ctrl+C. The server binds to loopback only. This is a local review application, not a publicly hosted multi-user service.

## Demo and live AI

No environment variables are required for demo mode. It is functional, deterministic English phrase analysis, **not a simulated live model response**. The interface starts in demo mode even if a key is available. Six examples include suspicious account security, payment pressure, a scarce prize, emotional coercion, a legitimate security notice, and a harmless invitation.

To enable optional live analysis:

```bash
cp .env.example .env
```

Edit `.env` locally:

| Variable | Purpose |
| --- | --- |
| `AI_API_KEY` | Server-only credential for your provider. Required with `AI_MODEL` for live mode. |
| `AI_MODEL` | A model you have access to that supports Chat Completions JSON mode and `max_completion_tokens`. No model is silently selected. |
| `AI_BASE_URL` | Defaults to `https://api.openai.com/v1`. An alternative compatible provider can supply its base URL, including `/v1` if required. HTTPS required except loopback HTTP. |
| `PORT` | Local port, default `4173`. |

Restart the server, select **Live AI · external provider**, then decode. Selecting live mode and submitting sends the message and tentative rule findings to that provider; its data policy applies. The app does not persist them. Missing credentials disable live mode. Provider failures are shown explicitly; there is **no silent fallback** or pretend AI output.

The adapter uses the documented [Chat Completions interface](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create). JSON mode is used for broader provider compatibility; it does not guarantee schema adherence, so Zod validation and exact-substring evidence checks are mandatory after every response. Provider compatibility varies. A live account/network call is not included in automated tests, which use controlled responses. Never put credentials in frontend code or a `VITE_` environment variable.

## Features

- Responsive dark workspace, keyboard-accessible controls, loading/error states, reduced-motion support.
- Message input capped at 10,000 JavaScript UTF-16 code units; original text is retained for exact quotes.
- Qualitative Low / Moderate / High / Critical assessments, never a fraud probability.
- Nine tactic categories covering urgency, guilt, authority, scarcity, social proof, trust-building, isolation, sensitive information, and payment pressure.
- Exact evidence highlighting, influence explanations, alternative readings, limitations, recommendations, optional safe reply.
- Copy report, copy reply, and print report using browser facilities. Clipboard access may depend on browser permissions.
- No account, database, message history, tracking, third-party fonts, or automatic link fetching.

## Architecture and files

- `src/main.ts`: browser UI, samples, request cancellation/stale-result protection, safe rendering, copy and print interactions.
- `src/style.css`: responsive visual design, accessible focus treatment, reduced-motion and print styles.
- `shared/schema.ts`: request/output schemas, limits, tactic names, evidence validation shared by browser and server.
- `shared/samples.ts`: six labeled sample messages. Labels are educational fixture descriptions, not measured accuracy results.
- `server/rules.ts`: deterministic baseline. Negation suppresses common “never share” false positives. Rules provide tentative candidates in live mode, which the model can reject based on context.
- `server/provider.ts`: replaceable `Provider` interface and compatible HTTP adapter; system/data separation, 25-second timeout, bounded response reading, controlled error messages.
- `server/app.ts`: HTTP API, request validation, rate and concurrency limits, security headers, local host/origin enforcement, production asset serving.
- `server/index.ts`: environment configuration, local server startup, development middleware.
- `tests/analysis.test.ts`, `tests/server.test.ts`: core and API tests using Node’s test runner.
- `tests/browser/workspace.spec.ts`: actual browser interactions at desktop/mobile sizes.
- `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `playwright.config.ts`, `index.html`, `.env.example`, `.gitignore`: setup and tooling.

API endpoints:

- `GET /api/config` → `{ "liveAvailable": false }` (no secrets or model configuration returned).
- `POST /api/analyze` with JSON `{ "message": "...", "mode": "demo" | "live" }` → validated assessment plus actual mode and notice.
- Errors return `{ "error": "safe description" }` and an appropriate HTTP status. No raw provider error bodies are exposed.

## Validation

```bash
npm run check       # lint, strict type checking, 10 core/API tests, production build
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e  # use installed Google Chrome
# Or download a project-local Chromium if Chrome is unavailable:
PLAYWRIGHT_BROWSERS_PATH=./work/browsers npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=./work/browsers npm run test:e2e
npm audit --omit=dev
```

Browser tests build and start a separate server on port 4174, then stop it. They require a supported Chromium runtime and Linux system libraries. Browser downloads stay in the ignored `work/` directory with the commands above. No system package installation is performed automatically.

Tests cover empty/oversized inputs, positive/negative examples, negation, fabricated evidence, malformed/refused/incomplete model responses, provider rate limiting/failure/timeout, injected instructions as untrusted message content, HTTP controls, examples, highlighting, clear/reset, error/loading states, safe HTML rendering, stale-result cancellation, and mobile overflow. Mock-provider tests verify the integration contract; they do not establish live-model accuracy or resistance to all prompt injection attacks.

## Security, privacy, and limitations

- Messages exist in browser/server memory for processing only. Refresh or Clear removes the visible report. There is no remote application storage, local storage, cookies, analytics, or message logging. Copy/print creates user-controlled copies outside the app.
- Live AI transmits content to the configured provider. Remove secrets and identifying information before submitting. Review that provider’s retention policy.
- The API accepts only bounded JSON; input is validated server-side. There are 30 analysis attempts/minute per local IP and at most four concurrent analyses. These are in-memory limits, reset at restart, intended for local use.
- Same-origin checks, host validation and loopback binding limit browser cross-site abuse and DNS rebinding. Production has a restrictive Content Security Policy and serves only built public assets. Vite development mode allows inline styles for its development middleware.
- Every rendered user/model string is HTML-escaped; submitted links are text, never automatically fetched. Model output cannot execute code or tools. No raw provider bodies or message contents are logged.
- System instructions and untrusted message text occupy separate roles. This reduces prompt-injection risk but does not prove immunity. A quote’s presence does not prove the model’s interpretation.
- Demo rules are not comprehensive NLP: obfuscation, synonyms, multilingual messages, quotations, sarcasm and complex negation can produce misses or false positives. A “Low” result is not a safety certificate.
- Risk levels are heuristic attention categories, not calibrated scores. No identity, URL reputation, factual claim, or sender intent is independently verified.
- OCR, uploads, saved history, authentication, and public deployment are intentionally outside this local version. Add appropriate authentication and deployment-specific abuse protections before exposing it to a network.

Do not commit `.env`, generated browser profiles, or sensitive reports. Git initialization and publishing are left to the project owner.

## Verification record — 16 October 2026

- `npm run check`: passed ESLint, strict TypeScript checking, 10 core/API tests, and production build.
- `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`: all 10 browser runs passed (five scenarios each at 1440×1000 desktop and 390×844 mobile).
- `npm audit`: zero known dependency vulnerabilities at the time of checking (including development dependencies).
- Local development server checked in the browser; suspicious demo evidence and desktop/mobile layout visually inspected.
- No live-provider request was made: no API key/model was configured. Provider behaviors were tested with controlled responses.
- Build emitted two non-fatal annotation warnings from Zod dependency comments; the frontend build completed successfully.
- Port 3000 was occupied by an existing application; Unphishable uses 4173 and its browser tests use 4174.
# Unphishable
