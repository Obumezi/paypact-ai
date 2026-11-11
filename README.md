# 🤝 PayPact AI — Autonomous Negotiation, PayPal Escrow & AG Grid Studio Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![PayPal Sandbox](https://img.shields.io/badge/PayPal-Invoicing%20v2%20%26%20Payouts%20v1-00457C?logo=paypal)](https://developer.paypal.com)
[![OpenAI Structured Outputs](https://img.shields.io/badge/AI-OpenAI%20Strict%20JSON%20Schema-412991?logo=openai)](https://platform.openai.com)
[![AG Grid & AG Charts](https://img.shields.io/badge/Dashboard-AG%20Grid%20%26%20AG%20Charts-3b82f6)](https://www.ag-grid.com)
[![Deployed on Render](https://img.shields.io/badge/Hosted-Render-46E3B7?logo=render)](https://render.com)

> **Tagline:** An autonomous AI escrow mediator, GitHub code auditor, and friendly invoice nudge-bot powered by PayPal Invoicing v2, Payouts v1, OpenAI, and AG Grid Studio.

**PayPact AI** is an **Agentic Commerce & Autonomous Escrow Platform** built for the **Build What's Next with PayPal and AI Hackathon**. It eliminates the trust gap in global freelance and peer-to-peer digital work by putting an autonomous AI contract mediator, deterministic GitHub code auditor, and friendly invoice nudge-bot directly behind the wheel of **PayPal's Invoicing v2 and Payouts v1 APIs**.

---

## Table of Contents
1. [Live Demo & Repository Links](#1-live-demo--repository-links)
2. [The Problem We Solve](#2-the-problem-we-solve)
3. [Why PayPact AI Matters (The Solution)](#3-why-paypact-ai-matters-the-solution)
4. [Key Features & 4-Stage Autonomous Workflow](#4-key-features--4-stage-autonomous-workflow)
5. [Best Use of AG Grid Showcase: AG Grid Studio & Custom Widgets](#5-best-use-of-ag-grid-showcase-ag-grid-studio--custom-widgets)
6. [Complete Setup and Run Instructions for Judges](#6-complete-setup-and-run-instructions-for-judges)
7. [Tools Used (PayPal APIs, AI Models & Sponsor Tools)](#7-tools-used-paypal-apis-ai-models--sponsor-tools)
8. [60-Second Interactive Walkthrough for Judges](#8-60-second-interactive-walkthrough-for-judges)
9. [Local Setup & Installation Instructions](#9-local-setup--installation-instructions)
10. [Cloud Deployment on Render](#10-cloud-deployment-on-render)
11. [API Endpoints Reference](#11-api-endpoints-reference)
12. [License](#12-license)

---

## 1. Live Demo & Repository Links

* **Live Hosted Demo URL (Render):** `https://paypact-ai.onrender.com` *(or run locally at `http://localhost:3000`)*
* **Public GitHub Repository:** [https://github.com/Obumezi/paypact-ai](https://github.com/Obumezi/paypact-ai)
* **Open Source License:** [MIT License](LICENSE) *(visible in the top-level repository About section)*

---

## 2. The Problem We Solve

Global freelance and peer-to-peer digital commerce suffers from a **$1.5T trust paradox**:
1. **Upfront Payment Risk vs. Delivery Risk:** Clients hesitate to send money upfront before seeing working deliverables, while freelancers hesitate to write or ship production code before knowing funds are safely locked.
2. **High Platform Fees & Slow Disputes:** Traditional freelance escrow marketplaces solve this by charging **5% to 20% in middleman fees** and relying on slow, manual human dispute resolution when disagreements arise over whether a deliverable meets specifications.
3. **Awkward Invoice Chasing:** Once an agreement is reached and an invoice is sent, freelancers are forced to act like debt collectors, sending uncomfortable follow-up messages when clients forget to fund an invoice.

---

## 3. Why PayPact AI Matters (The Solution)

PayPact AI transforms static payment links into **autonomous, self-enforcing financial contracts**:

* **Zero-Friction Contract Locking:** Instead of filling out rigid legal forms, the Client and Freelancer negotiate scope and pricing in plain English inside a shared chat room. **OpenAI (`gpt-4o-mini` with Strict Structured Outputs)** extracts the 5 mandatory contract terms in real time and automatically generates and sends a **PayPal Sandbox Invoice** the exact moment both parties agree.
* **Friendly Nudge-Bot (Zero Debt-Collection Awkwardness):** If an escrow invoice remains unpaid, our built-in **Nudge-Bot** drafts a warm, upbeat reminder (*"Hey! Just a friendly heads-up that Invoice #PP-0092 is ready whenever you are..."*) and dispatches it via PayPal's native Invoicing `/remind` API.
* **Deterministic AI Deliverable Auditing (Escrow Guardrail):** Before any money leaves escrow, the Freelancer submits their GitHub Pull Request URL, commit URL, or code snippet. Our **AI Code Auditor** inspects the actual code/diff against the agreed milestone criteria:
  * If the code is incomplete or a `TODO` placeholder, the AI **blocks the payout** and keeps the funds locked in escrow.
  * Once the code passes verification, PayPact AI immediately calls the **PayPal Payouts v1 API** to release the funds directly to the Freelancer's PayPal account.
* **0% Manual Dispute Bottlenecks:** Replaces expensive human arbitration with instant, transparent AI + PayPal API execution.

---

## 4. Key Features & 4-Stage Autonomous Workflow

```text
[Stage 1: AI Negotiation Room]
  Client & Freelancer negotiate in chat
  └──► OpenAI Strict JSON Schema extracts 5 contract parameters:
       (project_title, milestone_description, agreed_amount_usd, client_paypal_email, freelancer_paypal_email)
                    │
      (When agreement_reached === true)
                    ▼
[Stage 2: Autonomous Escrow Invoicing (PayPal Invoicing v2 API)]
  ├──► POST /v2/invoicing/generate-next-invoice-number
  ├──► POST /v2/invoicing/invoices (Creates Draft USD Invoice)
  └──► POST /v2/invoicing/invoices/{id}/send (Sends Invoice to Client)
                    │
       ┌────────────┴────────────┐
       ▼ (If Unpaid)             ▼ (When Paid)
[Friendly Nudge-Bot]      [Stage 3: Escrow Vault Locked]
  OpenAI drafts warm note   POST /v2/invoicing/invoices/{id}/payments
  POST .../remind           Invoice status transitions SENT ──► PAID
                                         │
                                         ▼
                          [Stage 4: AI Code Auditor & Auto-Payout]
                            Fetches GitHub PR/commit diff & audits against milestone
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼ (verified === false)                    ▼ (verified === true)
         [Escrow Guardrail Holds Funds]            [PayPal Payouts v1 Dispatched]
           Status: DELIVERABLE_CHANGES_REQUESTED     POST /v1/payments/payouts
           Lists missing code requirements           Transfers USD directly to Freelancer

```

- **Stage 1 — Multi-Party AI Contract Negotiation (**`NEGOTIATING`**):** Client and Freelancer negotiate scope and pricing in natural language. OpenAI extracts the 5 required contract parameters in real time, holding `agreement_reached: false` until all 5 fields are mutually confirmed.
- **Stage 2 — Autonomous Escrow Invoicing & Friendly Nudge-Bot (**`ESCROW_INVOICED`**):** Once `agreement_reached` flips to `true`, the backend calls the **PayPal Invoicing v2 API** to generate an invoice number, create a draft invoice, and send it to the Client (`SENT`). Unpaid invoices can be nudged via the **👋 Nudge-Bot** (`/remind`).
- **Stage 3 — Escrow Vault Lock (**`ESCROW_FUNDED`**):** When the Client pays the invoice (recorded via `/v2/invoicing/invoices/{id}/payments`), the invoice transitions to `PAID` and locks funds inside the PayPact Escrow Vault.
- **Stage 4 — Deterministic AI GitHub Code Auditing & Instant Payouts (**`PAYOUT_RELEASED`**):** The Freelancer submits a GitHub PR URL or code snippet. OpenAI audits the diff against `milestone_description`. Incomplete code triggers the **Escrow Guardrail** (`DELIVERABLE_CHANGES_REQUESTED`), while verified code (`verified: true`) immediately triggers a **PayPal Payouts v1** batch transfer (`POST /v1/payments/payouts`).

## 5. Best Use of AG Grid Showcase: AG Grid Studio & Custom Widgets

Instead of a static table, we built an interactive **AG Grid & AG Charts Studio Workspace** at the heart of the command center:

- **Custom Cell Renderer Widgets (**`cellRenderer`**):**
  - **Escrow Pipeline Pill Widget:** Color-coded state badges tracking each contract's lifecycle (`NEGOTIATING`, `ESCROW_INVOICED`, `ESCROW_FUNDED`, `DELIVERABLE_CHANGES_REQUESTED`, `PAYOUT_RELEASED`).
  - **AI Audit Confidence Bar Widget:** Embedded horizontal progress bars (`0–100%`) visualizing OpenAI's code audit confidence inside every row (emerald for pass, rose for fail).
  - **In-Row Nudge-Bot & Vault Action Widget:** Context-aware `👋 Nudge` and `💳 Fund` action buttons rendered directly inside unpaid invoice rows.
- **Live KPI & Friendly Scoreboard Tiles:** Real-time metric cards tracking *Total Contract Volume*, *Friendly Nudge Scoreboard (Unpaid Invoices)*, *AI Audit & Anomaly Watch (Escrow Guard)*, and *PayPal Payouts Dispatched*.
- **Companion AG Charts Donut Widget:** Synchronizes dynamically with AG Grid row updates to visualize USD capital allocation across *Unpaid (Nudge Scoreboard)*, *Locked in Escrow Vault*, and *Released via Payouts*.
- **Natural-Language Studio Grid Agent:** Translates plain-English queries (*"Show unpaid invoices needing a friendly nudge"*, *"Flag failed AI audits"*) into live AG Grid `filterModel` and `columnState` sorting configurations.

## 6. Complete Setup and Run Instructions for Judges

Judges can evaluate **PayPact AI** either by opening our live hosted web app or by running the repository locally in under 3 minutes:

- **Option A — Instant Hosted Evaluation (Zero Setup):**
  1. Open `https://paypact-ai.onrender.com` in your browser.
  2. Follow the [60-Second Interactive Walkthrough](#8-60-second-interactive-walkthrough-for-judges) using the built-in 1-click **Demo** buttons (`Demo: Client Offer`, `Demo: Freelancer Accept`, `💳 Confirm Escrow Payment`, `Demo: Bad Code`, and `Demo: Valid PR`).
- **Option B — Quick Local Build & Run:**

  **Bash**
  ```
  git clone https://github.com/Obumezi/paypact-ai.git
  cd paypact-ai
  npm install
  cp .env.example .env
  # Add your PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and OPENAI_API_KEY in .env
  node server.js

  ```
  Then open `http://localhost:3000` in your browser. *(See [Section 9](#9-local-setup--installation-instructions) below for full step-by-step environment details.)*

## 7. Tools Used (PayPal APIs, AI Models & Sponsor Tools)

### 1. PayPal Developer Platform (Sandbox Environment — `api-m.sandbox.paypal.com`)

Implemented in `paypal.js` using **OAuth 2.0 Client Credentials** (`POST /v1/oauth2/token`) and orchestrating **6 distinct PayPal REST API endpoints**:

- `POST /v2/invoicing/generate-next-invoice-number` — Generates sequential invoice numbers for each locked AI contract.
- `POST /v2/invoicing/invoices` — Creates structured USD escrow draft invoices containing the AI-extracted milestone specifications and recipient metadata.
- `POST /v2/invoicing/invoices/{invoice_id}/send` — Automatically dispatches the escrow invoice to the Client upon negotiation lock and retrieves the `recipient_view_url`.
- `POST /v2/invoicing/invoices/{invoice_id}/remind` — Powers our **Nudge-Bot**, sending warm AI-authored reminders for unpaid escrow invoices.
- `GET /v2/invoicing/invoices/{invoice_id}` & `POST /v2/invoicing/invoices/{invoice_id}/payments` — Verifies and records escrow funding (`SENT` → `PAID`).
- `POST /v1/payments/payouts` — Executes autonomous USD batch payouts to the Freelancer's PayPal Sandbox account the moment the AI Code Auditor verifies their deliverable.

### 2. AI Service & Model: OpenAI (`gpt-4o-mini` with Strict Structured Outputs)

Implemented in `agent.js` using the official `openai` Node.js SDK with **Strict JSON Schema Structured Outputs (**`response_format: { type: "json_schema", strict: true }`**)**:

- **Autonomous Negotiation Mediator (**`processNegotiationTurn`**):** Parses multi-party chat transcripts to extract contract terms and deterministically trigger PayPal invoicing when `agreement_reached === true`.
- **Deliverable & GitHub Code Auditor (**`verifyDeliverable`**):** Inspects fetched GitHub `.diff` patches and code submissions against the contract's `milestone_description`, returning `verified` (`boolean`), `confidence_score` (`0–100`), `audit_summary`, and `missing_requirements`.
- **Friendly Nudge-Bot (**`generateFriendlyNudge`**):** Generates upbeat, zero-pressure payment heads-up messages for unpaid invoices.
- **AG Grid Studio NL Agent (**`interpretGridCommand`**):** Translates natural-language user queries into structured AG Grid filter, sort, and widget spotlight configurations.

### 3. Sponsor & Developer Tools Integrated

- **AG Grid (**`ag-grid-community`**) & AG Charts (**`ag-charts-community`**):** Powers the **Autonomous Escrow & Payouts Ledger**, custom HTML cell renderers, KPI scoreboard widgets, and companion financial donut chart.
- **Render (**`render.yaml`**):** Cloud application platform hosting our full-stack Node.js/Express web service and REST API endpoints.
- **GitHub REST / Raw Diff Integration:** Used by the AI Code Auditor to fetch real pull request and commit diffs (`.diff`) for milestone verification.

## 8. 60-Second Interactive Walkthrough for Judges

Once you open the app (locally at `http://localhost:3000` or via our live Render URL), follow these 5 steps using the built-in **Demo** buttons:

1. **Propose the Contract (Client):**
   - In the top-right header of the chat panel, click `Demo: Client Offer`, then click `Send Turn`.
   - Watch **Card 1 (Live Extracted Contract JSON)** on the right extract the Project Title, `$150.00 USD` amount, `/healthz` milestone criteria, and Client PayPal email while keeping the deal in `NEGOTIATING` state.
2. **Accept Terms & Auto-Dispatch PayPal Invoice (Freelancer):**
   - In the chat header, click `Demo: Freelancer Accept`, then click `Send Turn`.
   - All 5 contract terms lock in! PayPact AI immediately calls the **PayPal Invoicing v2 API** and displays the real `INV2-...` Sandbox Invoice ID and `#PP-...` Invoice Number inside **Card 2 (PayPal Escrow Vault)**.
   - *Optional Nudge-Bot Test:* Click `👋 Nudge-Bot Reminder` to generate a friendly AI reminder in chat and trigger PayPal's Invoice Remind API.
3. **Fund the PayPal Escrow Vault:**
   - In **Card 2 (PayPal Escrow Vault)**, click `💳 Confirm Escrow Payment`.
   - The invoice status transitions from `SENT` to `PAID` (`ESCROW_FUNDED`), locking the `$150.00 USD` in the vault and unlocking the Deliverable Auditor below.
4. **Test the AI Code Auditor Guardrail (Bad Code Blocked):**
   - In **Card 3 (AI Deliverable Auditor & Payout)**, click `Demo: Bad Code` to fill the box with a `// TODO` placeholder snippet, then click `🔍 Run AI Deliverable Audit & Release PayPal Payout`.
   - Watch the **OpenAI Code Auditor** reject the incomplete code (`⚠️ Deliverable Rejected by AI Auditor`) and block the payout so the Client's escrow funds remain safely locked.
5. **Submit Valid Code & Trigger Instant PayPal Payout:**
   - In **Card 3**, click `Demo: Valid PR` to populate the GitHub PR URL and valid Express.js `/healthz` route code, then click `🔍 Run AI Deliverable Audit & Release PayPal Payout`.
   - Watch OpenAI verify the deliverable (`100% confidence`) and automatically trigger the **PayPal Payouts v1 API**, displaying the green `✅ PayPal Payout Dispatched!` banner with the live PayPal `Batch ID` and updating the **AG Grid Ledger** at the bottom of the page!

## 9. Local Setup & Installation Instructions

### Prerequisites

- **Node.js** (v18.0.0 or higher) and `npm`
- **PayPal Developer Account:** Free Sandbox `Client ID` and `Secret` from the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) (*Apps & Credentials → Sandbox → Create App*). Ensure **Invoicing** and **Payouts** are enabled.
- **OpenAI API Key:** From the [OpenAI Platform](https://platform.openai.com/api-keys).

### Step-by-Step Installation

1. **Clone the repository:**

   **Bash**
   ```
   git clone https://github.com/Obumezi/paypact-ai.git
   cd paypact-ai

   ```
2. **Install dependencies:**

   **Bash**
   ```
   npm install

   ```
3. **Configure environment variables:**

   **Bash**
   ```
   cp .env.example .env

   ```
   Open `.env` and populate your credentials:

   **Code snippet**
   ```
   PORT=3000
   PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
   PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id_here
   PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret_here
   OPENAI_API_KEY=sk-proj-your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini

   ```
4. **Start the application:**

   **Bash**
   ```
   node server.js

   ```
   *(Or run with auto-reload during development: `npx nodemon server.js`)*
5. **Open in browser:** Navigate to `http://localhost:3000`.

## 10. Cloud Deployment on Render

This repository includes a `render.yaml` Blueprint for rapid deployment on **Render**:

1. Push this repository to GitHub (`https://github.com/Obumezi/paypact-ai`).
2. Log into the [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
3. Connect your `paypact-ai` GitHub repository.
4. Set **Build Command** to `npm install` and **Start Command** to `node server.js`.
5. Add the following **Environment Variables** in Render:
   - `PAYPAL_API_BASE` = `https://api-m.sandbox.paypal.com`
   - `PAYPAL_CLIENT_ID` = *(Your PayPal Sandbox Client ID)*
   - `PAYPAL_CLIENT_SECRET` = *(Your PayPal Sandbox Secret)*
   - `OPENAI_API_KEY` = *(Your OpenAI API Key)*
   - `OPENAI_MODEL` = `gpt-4o-mini`
6. Click **Create Web Service** to generate your live public HTTPS URL.

## 11. API Endpoints Reference

| Method | Endpoint                               | Description                                                                                                     |
| ------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/health/paypal`                   | Verifies PayPal Sandbox OAuth 2.0 connection and OpenAI readiness.                                              |
| `POST` | `/api/negotiate`                       | Processes a chat turn with OpenAI and auto-creates/sends a PayPal Invoice when `agreement_reached === true`.    |
| `POST` | `/api/deals/:dealId/nudge`             | Generates a friendly Nudge-Bot reminder via OpenAI and calls PayPal's `/v2/invoicing/invoices/{id}/remind` API. |
| `POST` | `/api/deals/:dealId/fund`              | Verifies or records Client escrow payment (`PAID`) via PayPal's `/v2/invoicing/invoices/{id}/payments` API.     |
| `POST` | `/api/deals/:dealId/verify-and-payout` | Audits submitted GitHub URL/code with OpenAI and triggers `POST /v1/payments/payouts` if `verified === true`.   |
| `POST` | `/api/grid-agent`                      | Translates natural-language queries into AG Grid filter, sort, and widget spotlight states.                     |
| `POST` | `/api/seed`                            | Seeds multi-state sample deals into the AG Grid & AG Charts workspace for instant judge evaluation.             |
| `GET`  | `/api/deals`                           | Returns all active escrow deals for the AG Grid ledger.                                                         |
| `GET`  | `/api/deals/:dealId`                   | Returns full state, chat history, contract JSON, invoice, verification, and payout details for a single deal.   |

## 12. License

This project is open-source and distributed under the **MIT License**. See the [`LICENSE`](LICENSE) file for full details.
