# 🤝 PayPact AI — Autonomous Negotiation, PayPal Escrow & AG Grid Studio Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![PayPal Sandbox](https://img.shields.io/badge/PayPal-Invoicing%20v2%20%26%20Payouts%20v1-00457C?logo=paypal)](https://developer.paypal.com)
[![OpenAI Structured Outputs](https://img.shields.io/badge/AI-OpenAI%20Strict%20JSON%20Schema-412991?logo=openai)](https://platform.openai.com)
[![AG Grid & AG Charts](https://img.shields.io/badge/Dashboard-AG%20Grid%20%26%20AG%20Charts-3b82f6)](https://www.ag-grid.com)
[![Deployed on Render](https://img.shields.io/badge/Hosted-Render-46E3B7?logo=render)](https://render.com)

> **Tagline:** An autonomous AI escrow mediator, GitHub code auditor, and friendly invoice nudge-bot powered by PayPal Invoicing v2, Payouts v1, OpenAI, and AG Grid Studio.

**PayPact AI** is an **Agentic Commerce & Autonomous Escrow Platform** built for the **Build What's Next with PayPal and AI Hackathon**. It eliminates the trust gap in global freelance and peer-to-peer digital work by putting an autonomous AI contract mediator, deterministic GitHub code auditor, and friendly invoice nudge-bot directly behind the wheel of **PayPal's Invoicing v2 and Payouts v1 APIs**.

---

## 📑 Table of Contents
1. [Live Demo & Repository Links](#-live-demo--repository-links)
2. [The Problem We Solve](#-the-problem-we-solve)
3. [Why PayPact AI Matters (The Solution)](#-why-paypact-ai-matters-the-solution)
4. [Key Features & 4-Stage Autonomous Workflow](#-key-features--4-stage-autonomous-workflow)
5. [Best Use of AG Grid Showcase: AG Grid Studio & Custom Widgets](#-best-use-of-ag-grid-showcase-ag-grid-studio--custom-widgets)
6. [System Architecture & State Machine](#-system-architecture--state-machine)
7. [Tools Used (PayPal APIs, AI Models & Sponsor Tools)](#-tools-used-paypal-apis-ai-models--sponsor-tools)
8. [Alignment with Hackathon Judging Criteria](#-alignment-with-hackathon-judging-criteria)
9. [60-Second Interactive Walkthrough for Judges](#-60-second-interactive-walkthrough-for-judges)
10. [Local Setup & Installation Instructions](#-local-setup--installation-instructions)
11. [Cloud Deployment on Render](#-cloud-deployment-on-render)
12. [API Endpoints Reference](#-api-endpoints-reference)
13. [License](#-license)

---

## 🌐 Live Demo & Repository Links

* **Live Hosted Demo URL (Render):** `https://paypact-ai.onrender.com` *(or run locally at `http://localhost:3000`)*
* **Public GitHub Repository:** [https://github.com/Obumezi/paypact-ai](https://github.com/Obumezi/paypact-ai)
* **Open Source License:** [MIT License](LICENSE) *(visible in the top-level repository About section)*

---

## 🚨 The Problem We Solve

Global freelance and peer-to-peer digital commerce suffers from a **$1.5T trust paradox**:
1. **Upfront Payment Risk vs. Delivery Risk:** Clients hesitate to send money upfront before seeing working deliverables, while freelancers hesitate to write or ship production code before knowing funds are safely locked.
2. **High Platform Fees & Slow Disputes:** Traditional freelance escrow marketplaces solve this by charging **5% to 20% in middleman fees** and relying on slow, manual human dispute resolution when disagreements arise over whether a deliverable meets specifications.
3. **Awkward Invoice Chasing:** Once an agreement is reached and an invoice is sent, freelancers are forced to act like debt collectors, sending uncomfortable follow-up messages when clients forget to fund an invoice.

---

## 💡 Why PayPact AI Matters (The Solution)

PayPact AI transforms static payment links into **autonomous, self-enforcing financial contracts**:

* **Zero-Friction Contract Locking:** Instead of filling out rigid legal forms, the Client and Freelancer negotiate scope and pricing in plain English inside a shared chat room. **OpenAI (`gpt-4o-mini` with Strict Structured Outputs)** extracts the 5 mandatory contract terms in real time and automatically generates and sends a **PayPal Sandbox Invoice** the exact moment both parties agree.
* **Friendly Nudge-Bot (Zero Debt-Collection Awkwardness):** If an escrow invoice remains unpaid, our built-in **Nudge-Bot** drafts a warm, upbeat reminder (*"Hey! Just a friendly heads-up that Invoice #PP-0092 is ready whenever you are..."*) and dispatches it via PayPal's native Invoicing `/remind` API.
* **Deterministic AI Deliverable Auditing (Escrow Guardrail):** Before any money leaves escrow, the Freelancer submits their GitHub Pull Request URL, commit URL, or code snippet. Our **AI Code Auditor** inspects the actual code/diff against the agreed milestone criteria:
  * If the code is incomplete or a `TODO` placeholder, the AI **blocks the payout** and keeps the funds locked in escrow.
  * Once the code passes verification, PayPact AI immediately calls the **PayPal Payouts v1 API** to release the funds directly to the Freelancer's PayPal account.
* **0% Manual Dispute Bottlenecks:** Replaces expensive human arbitration with instant, transparent AI + PayPal API execution.

---

## 🚀 Key Features & 4-Stage Autonomous Workflow

### Stage 1: Multi-Party AI Contract Negotiation (`NEGOTIATING`)
* Client and Freelancer negotiate scope, deliverables, and pricing in natural language inside the **Autonomous Negotiation Room**.
* Using **OpenAI Strict Structured Outputs (`json_schema`)**, the agent dynamically extracts 5 mandatory contract parameters (`project_title`, `milestone_description`, `agreed_amount_usd`, `client_paypal_email`, `freelancer_paypal_email`), displaying live readiness checkmarks (`0/5` → `5/5 Ready`) on the UI.
* The agent holds `agreement_reached: false` while terms are debated and flips to `agreement_reached: true` the exact moment both parties agree.

### Stage 2: Autonomous Escrow Invoicing & Friendly Nudge-Bot (`ESCROW_INVOICED`)
* The millisecond `agreement_reached` becomes `true`, the backend automatically calls the **PayPal Invoicing v2 API** to generate a sequential invoice number, create a draft escrow invoice, and dispatch it to the Client (`SENT` / `UNPAID`).
* **👋 Friendly Nudge-Bot & Scoreboard:** If an invoice remains unpaid, users can trigger the **Nudge-Bot** directly from the vault card or inside the AG Grid ledger row. OpenAI drafts a friendly check-in message and dispatches it via PayPal's `/v2/invoicing/invoices/{id}/remind` endpoint.

### Stage 3: Escrow Vault Lock (`ESCROW_FUNDED`)
* Once the Client funds the invoice (verified or recorded via PayPal's `/v2/invoicing/invoices/{id}/payments` API), the invoice transitions to `PAID` and the funds are locked in the PayPact AI Escrow Vault.

### Stage 4: Deterministic AI GitHub Code Auditing & Instant Payouts (`PAYOUT_RELEASED`)
* The Freelancer submits a GitHub Pull Request URL, commit URL, or code snippet.
* Our backend fetches the raw `.diff` or code content from GitHub and passes it to the **OpenAI Code Auditor**, which evaluates the implementation strictly against the locked `milestone_description`.
* **🛡️ Escrow Guardrail:** If the code fails requirements, the AI sets `verified: false`, logs a low confidence score, and holds the funds in escrow (`DELIVERABLE_CHANGES_REQUESTED`).
* **💸 Autonomous Release:** When the deliverable passes verification (`verified: true`), PayPact AI immediately calls the **PayPal Payouts v1 API** (`POST /v1/payments/payouts`) with an idempotent batch header, transferring the USD payout directly to the Freelancer's PayPal account.

---

## 📊 Best Use of AG Grid Showcase: AG Grid Studio & Custom Widgets

Instead of a plain data table, we built an interactive **AG Grid & AG Charts Studio Workspace** at the heart of the command center:

* **Custom Cell Renderer Widgets (`cellRenderer`):**
  * **Escrow Pipeline Pill Widget:** Color-coded state badges tracking each contract's lifecycle (`NEGOTIATING`, `ESCROW_INVOICED`, `ESCROW_FUNDED`, `DELIVERABLE_CHANGES_REQUESTED`, `PAYOUT_RELEASED`).
  * **AI Audit Confidence Bar Widget:** Embedded horizontal progress bars (`0–100%`) visualizing OpenAI's code audit confidence inside every row (emerald for pass, rose for fail).
  * **In-Row Nudge-Bot & Vault Action Widget:** Context-aware `👋 Nudge (count)` and `💳 Fund` action buttons rendered directly inside unpaid invoice rows.
* **4 Live KPI & Friendly Scoreboard Tiles:** Real-time metric cards above the grid tracking:
  1. *Total Contract Volume*
  2. *👋 Friendly Nudge Scoreboard (Unpaid Invoices)* — styled as a friendly scoreboard showing who still owes what
  3. *🛡️ AI Audit & Anomaly Watch (Escrow Guard)* — flags blocked PR deliverables
  4. *PayPal Payouts Dispatched*
* **Companion AG Charts Donut Widget:** Synchronizes dynamically with AG Grid row updates to visualize USD capital allocation across *Unpaid (Nudge Scoreboard)*, *Locked in Escrow Vault*, and *Released via Payouts*.
* **Natural-Language Studio Grid Agent:** Users can ask plain-English questions (*"Show unpaid invoices that need a friendly nudge scoreboard"*, *"Flag failed AI audits"*, *"Show completed payouts sorted by highest amount"*) and OpenAI dynamically applies AG Grid `filterModel`, `columnState` sorting, and KPI widget glow highlights.

---

## 🏗️ System Architecture & State Machine

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