# 🛡️ SentinelVoice (Team Nexus)
## Multimodal AI Servicing Assistant with Real-Time Fraud Verification & Autonomous Action Execution

[![Live App on Vercel](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://sentinel-voice-kx3d.vercel.app)
[![Live Backend on Render](https://img.shields.io/badge/Backend_API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://sentinel-voice-backend-7u0v.onrender.com)
[![Swagger Docs](https://img.shields.io/badge/API_Docs-Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://sentinel-voice-backend-7u0v.onrender.com/docs)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/truptishinde1919-rgb/sentinel-voice-/actions)

SentinelVoice is an enterprise-grade AI customer servicing platform engineered by **Team Nexus**. The system provides real-time, low-latency (<800ms) speech-to-speech and video interaction between banking customers and an autonomous AI servicing agent. It executes transactional account actions (fee waivers, credit limit reviews, card replacements) via deterministic backend tool calls while running continuous multimodal biometric fraud verification (facial liveness and acoustic scoring).

---

## 🌐 Where to See & Check Your Live Project

You can interact with your live deployed project right now in your browser:

| Service | Description | Direct Link |
| :--- | :--- | :--- |
| **Customer Servicing Portal** | Live voice widget, biometric video HUD & interactive card | 🔗 **[sentinel-voice-kx3d.vercel.app](https://sentinel-voice-kx3d.vercel.app)** |
| **Supervisor SOC & Compliance** | Real-time session monitoring & PostgreSQL audit trace viewer | 🔗 **[sentinel-voice-kx3d.vercel.app/admin](https://sentinel-voice-kx3d.vercel.app/admin)** |
| **Live FastAPI Backend** | Uvicorn ASGI server with WebSockets streaming on Render | 🔗 **[sentinel-voice-backend-7u0v.onrender.com](https://sentinel-voice-backend-7u0v.onrender.com)** |
| **Interactive API Documentation** | OpenAPI Swagger test console for all backend routes | 🔗 **[sentinel-voice-backend-7u0v.onrender.com/docs](https://sentinel-voice-backend-7u0v.onrender.com/docs)** |
| **Database & API Health Check** | System status and PostgreSQL connection indicator | 🔗 **[sentinel-voice-backend-7u0v.onrender.com/health](https://sentinel-voice-backend-7u0v.onrender.com/health)** |

---

## 📚 Core Documentation Index

Comprehensive technical documentation is available directly in the repository:

| Document | Purpose & Key Topics |
| :--- | :--- |
| 📄 **[PRD.md](PRD.md)** | Product Requirements Document: Problem statement, personas, functional & non-functional requirements, KPIs. |
| 🏛️ **[Architecture.md](Architecture.md)** | System Architecture: Multi-tier diagrams, sequence flow, WebSockets, client/backend tier deep-dive. |
| 🛡️ **[Rules.md](Rules.md)** | Deterministic Guardrails: Hardcoded banking ceilings ($50 fee waiver, 25% credit cap), 15% fraud risk rule catalog. |
| 🎨 **[Design.md](Design.md)** | UI/UX System: Cybernetic Obsidian aesthetic, color tokens, canvas HUD, waveform visualizer specs. |
| 📋 **[Task.md](Task.md)** | Work Breakdown Structure: Completed sprint deliverables, milestone status, and future roadmap. |
| 🧠 **[Memory.md](Memory.md)** | Memory & Persistence: 4-tier state architecture, LangGraph scratchpad, PostgreSQL schema, PII sanitization. |

---

## 🕹️ Step-by-Step: How to Test & Verify the System

Open **[https://sentinel-voice-kx3d.vercel.app](https://sentinel-voice-kx3d.vercel.app)** and follow these 4 test scenarios:

### Test 1: Autonomous Courtesy Fee Waiver (APPROVED)
1. In the **Demo Account Switcher** (top left), click **Elena Rostova** (Tier 1 Low Risk).
2. Click the quick prompt chip: `"Waive my $35 overdraft fee"` (or speak it into your microphone).
3. **What happens**:
   - The AI evaluates biometric confidence (96.8%) and liveness (PASSED).
   - The Deterministic Policy Engine verifies that `$35 <= $50` policy ceiling and no waivers occurred in the past 90 days.
   - The balance is updated from **$4,885.50** to **$4,920.50** in real time!
   - A full JSON reasoning trace is logged in the right column.

### Test 2: Policy Ceiling Breach (BLOCKED BY GUARDRAILS)
1. With **Elena Rostova** selected, click the prompt: `"Please waive my $150 credit card penalty fee"`.
2. **What happens**:
   - The AI detects the intent, but the **Hardcoded Policy Engine** intercepts it before any database write.
   - The guardrail blocks the request with: `Requested fee waiver amount ($150.00) exceeds policy ceiling of $50.00`.
   - The right-hand Audit Trace displays the red `VIOLATED` badge.

### Test 3: Face Spoof / Deepfake Attack (WARM HANDOFF ESCALATION)
1. On the center **Biometric Vision HUD**, click **"Inject Synthetic Spoof Attack"**.
2. **What happens**:
   - The facial bounding box turns crimson red.
   - Dynamic Fraud Risk spikes to **64.8%** (> 15% threshold).
   - Autonomous servicing is immediately suspended for security.
   - A red **Warm Transfer** banner is triggered to transfer the session to a human supervisor.

### Test 4: Check the Supervisor Operations Center (SOC)
1. Click the top-right button: **Supervisor SOC Portal** (or open [sentinel-voice-kx3d.vercel.app/admin](https://sentinel-voice-kx3d.vercel.app/admin)).
2. **What happens**:
   - View live sessions with real-time sentiment scores and risk gauges.
   - See the flagged session queued in the **Warm Transfer Alert Queue**.
   - Click **"Accept Warm Handoff"** or **"Monitor Audio"** to take supervisor control.
   - Click any row in the **Compliance Audit Trail** to inspect the full raw JSON trace payload stored in PostgreSQL.

---

## 🏛️ How It Works (System Architecture)

```
                                  [ CUSTOMER PORTAL ]
                             (https://sentinel-voice-kx3d.vercel.app)
                                           │
                       ┌───────────────────┴───────────────────┐
                       │ WebRTC / Streaming WebSockets         │
                       ▼                                       ▼
            [ Live Biometric HUD ]                  [ Voice Interface Widget ]
         - 2D/3D Passive Liveness                - Streaming WebSockets Audio
         - Facial Landmark Mesh                  - Real-Time Waveform Visualizer
         - Bounding Box Tracking                 - Speech Synthesis & Recognition
                       │                                       │
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼
                                 [ SENTINEL BACKEND ]
                 (https://sentinel-voice-backend-7u0v.onrender.com)
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 │                                                   │
                 ▼                                                   ▼
     [ Security & Biometrics ]                             [ PII Scrubber ]
  - Dynamic Fraud Risk Engine (0-100%)                  - Microsoft Presidio
  - Passive 2D/3D Liveness Scorer                       - Regex Fallback Guard
  - Spectral Spoof Detection                                         │
                 │                                                   │
                 └─────────────────────────┬─────────────────────────┘
                                           │
                                           ▼
                            [ LangGraph Servicing Agent ]
                                           │
                                           ▼
                        [ Deterministic Policy Engine (Guardrails) ]
                     - $50 Max Courtesy Fee Waiver (1 per 90 Days)
                     - 25% Max Credit Line Increase (Tier <= 2)
                     - Strict Biometric Re-Auth for Card Reissuance
                     - Fraud Risk > 15% ➔ Automatic Warm Handoff
                                           │
                      ┌────────────────────┴────────────────────┐
                      ▼                                         ▼
            [ Banking Tools Execution ]                [ Compliance Audit Log ]
         - Real-time Ledger Updates                 - Real-time JSON Trace Feed
         - Account Balance & Limits                 - LLM Reasoning Logs
         - Card Freeze & Replacement                - Supervisor SOC Dashboard
```

---

## 🔒 Deterministic Policy Engine (Guardrails Table)

| Rule ID | Rule Name | Condition / Ceiling | Enforcement Action |
| :--- | :--- | :--- | :--- |
| `GUARD-BIO-01` | Biometric Authenticity | Confidence $\ge 85.0\%$, Liveness = True | Blocks transaction; flags for supervisor |
| `GUARD-RISK-02` | Dynamic Fraud Risk Ceiling | Fraud Risk $\le 15.0\%$ | Suspends autonomous mode; triggers warm transfer |
| `GUARD-TIER-03` | Customer Risk Tier Check | User Tier $\le 2$ (Tier 1 & 2 allowed) | Blocks Tier 3 customers from self-service adjustments |
| `GUARD-FEE-04A` | Max Courtesy Fee Waiver | Max $\$50.00$ per transaction | Rejects excess amounts before database write |
| `GUARD-FEE-04B` | Fee Waiver Frequency Limit | Max 1 waiver per 90 days | Rejects if past waiver executed within 90 days |
| `GUARD-CRD-05` | Max Credit Line Adjustment | Max $25\%$ of current limit | Routes larger requests to human underwriter |
| `GUARD-CARD-06` | Card Replacement Security | Confidence $\ge 90\%$, Risk $\le 10\%$ | Freezes old card; issues new Contactless Visa |

---

## 📊 Database Schema (PostgreSQL Models)

1. `users`: `id`, `full_name`, `email`, `phone_number`, `account_balance`, `credit_limit`, `risk_tier`, `facial_embedding_hash`, `voice_print_id`, `created_at`.
2. `servicing_sessions`: `id`, `user_id`, `channel`, `session_status`, `sentiment_score`, `started_at`, `ended_at`.
3. `fraud_checks`: `id`, `session_id`, `verification_type`, `confidence_score`, `liveness_passed`, `fraud_risk_score`, `decision`, `performed_at`.
4. `account_actions`: `id`, `user_id`, `session_id`, `action_type`, `requested_amount`, `status`, `executed_at`.
5. `audit_logs`: `id`, `session_id`, `user_id`, `tool_name`, `policy_passed`, `policy_rules_evaluated` (JSONB), `llm_reasoning_trace`, `raw_payload` (JSONB), `created_at`.

---

## 💻 How to Run Locally

If you also wish to run the project locally on your machine:

### 1. Start the Backend:
```powershell
cd "backend"
.\.venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```
*(Or double-click `run_backend.bat`)*

### 2. Start the Frontend:
```powershell
cd "frontend"
npm run dev
```
*(Or double-click `run_frontend.bat`)*

- Local Customer Portal: `http://localhost:3000`
- Local Supervisor Portal: `http://localhost:3000/admin`
- Local Swagger API Docs: `http://localhost:8000/docs`
