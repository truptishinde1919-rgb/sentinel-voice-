# SentinelVoice (Team Nexus)
## Multimodal AI Servicing Assistant with Real-Time Fraud Verification & Autonomous Action Execution

SentinelVoice is an enterprise-grade AI customer servicing platform enabling real-time, low-latency (<800ms) speech/video interaction between customers and an autonomous AI servicing agent. The system automatically executes high-frequency account actions (e.g., fee waivers, credit limit increases, card replacements) via deterministic backend tool calls while executing real-time multimodal biometric fraud checks (face matching & liveness scoring) for sensitive transactions.

---

## 🏛️ System Architecture

```
                                  [ CUSTOMER PORTAL ]
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

## 🚀 Key Features

1. **Omni-Channel Multimodal Servicing Portal**:
   - Sub-800ms speech-to-speech interaction powered by WebSockets and Web Speech API.
   - Interactive live video canvas overlay with dynamic bounding box tracking and 2D/3D facial liveness scoring.
   - Real-time customer balance and account status dashboard with live Obsidian metal card rendering.

2. **Agentic Orchestration & Deterministic Guardrails**:
   - Multi-turn conversational reasoning using LangGraph/LangChain architecture.
   - Deterministic policy validation layer that enforces banking limits **before** database writes:
     * Fee waiver max $50 ceiling; checks for past waivers within 90 days.
     * Credit limit adjustments capped at 25% of current balance.
     * Card replacement requires facial biometric match >= 85% and passed liveness.
     * If dynamic fraud risk > 15%, autonomous execution is suspended and routed to supervisor warm transfer.

3. **Biometric Fraud Detection & Risk Engine**:
   - Passive 2D/3D facial liveness scoring and voice acoustic analysis.
   - Dynamic Risk Scoring Engine (0–100%) calculating composite risk across biometric confidence, voice harmonics, transaction sensitivity, and customer risk tiers.
   - Includes interactive "Inject Synthetic Spoof Attack" toggle to test fraud detection and warm handoff escalation in real time.

4. **Compliance Audit & Human-in-the-Loop (HITL) Supervisor Dashboard**:
   - Live JSON trace logging of LLM reasoning, policy rule evaluations, biometric risk scores, and tool call payloads.
   - Admin supervisor view at `/admin` for active call monitoring, audio inspection, and one-click warm handoff takeover.

---

## 📂 Repository Structure

```
sentinel-voice/
├── .gitignore                   # Ignore node_modules, .next, .venv, build artifacts
├── README.md                    # Project documentation & deployment guide
├── render.yaml                  # 1-Click Render Blueprint (Backend + Managed PostgreSQL)
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD pipeline for GitHub (Test Backend + Build Next.js)
├── backend/
│   ├── Dockerfile               # Production container for Render / Docker runtimes
│   ├── main.py                  # FastAPI with WebSockets, CORS and supervisor broadcast
│   ├── config.py                # Environment configuration & policy thresholds
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Backend environment template
│   ├── agents/
│   │   ├── servicing_agent.py   # LangGraph agent workflow & state manager
│   │   └── guardrails.py        # Hardcoded deterministic policy validation engine
│   ├── tools/
│   │   ├── banking_tools.py     # Database tools (fee_waiver, limit_check, card_replace)
│   │   └── rag_tools.py         # Knowledge base policy vector search tool
│   ├── security/
│   │   ├── biometrics.py        # Passive 2D/3D liveness, face match & dynamic risk scoring
│   │   └── pii_scrubber.py      # Microsoft Presidio & regex PII masking utility
│   └── database/
│       ├── models.py            # SQLAlchemy models (User, Session, FraudCheck, Action, AuditLog)
│       └── db_session.py        # Async database engine & demo seeding
├── frontend/
│   ├── vercel.json              # Vercel deployment route & camera/mic permissions
│   ├── package.json             # Next.js 14, Tailwind, Lucide React, Framer Motion
│   ├── tailwind.config.js       # Dark-mode cybernetic HUD palette
│   ├── tsconfig.json            # TypeScript configuration
│   ├── .env.example             # Frontend environment variables template
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # Root layout
│       │   ├── globals.css      # Glassmorphism, animations & cybernetic grid lines
│       │   ├── page.tsx         # Customer-Facing Servicing Portal
│       │   └── admin/
│       │       └── page.tsx     # Compliance Audit & HITL Supervisor Dashboard
│       ├── components/
│       │   ├── VoiceWidget.tsx      # Waveform visualizer, mic input & speech synthesis
│       │   ├── BiometricOverlay.tsx # Live camera feed, face bounding box & spoof injection
│       │   ├── AuditLogger.tsx      # Real-time JSON trace logger & policy rule inspector
│       │   └── AccountSummary.tsx   # Obsidian credit card mockup, balance & user switcher
│       └── lib/
│           └── websocket.ts     # Client WebSocket manager
├── run_backend.bat              # One-click Windows runner for backend
└── run_frontend.bat             # One-click Windows runner for frontend
```

---

## 🚢 Automated 1-Click Deployment (GitHub + Render + Vercel)

### Step 1: Push Codebase to GitHub
```bash
git init
git add .
git commit -m "feat: SentinelVoice full-stack enterprise release"
git remote add origin https://github.com/<your-username>/sentinel-voice.git
git branch -M main
git push -u origin main
```
*The GitHub Actions CI/CD pipeline ([deploy.yml](file:///c:/Users/DELL/Downloads/Multimodal%20AI%20%20Assistant%20Fraud%20Verification/sentinel-voice/.github/workflows/deploy.yml)) will run automated guardrail tests and build the Next.js bundle on push.*

---

### Step 2: Deploy Backend & PostgreSQL on Render (1-Click Blueprint)
1. Go to your **Render Dashboard** ([dashboard.render.com](https://dashboard.render.com)).
2. Click **New +** ➔ **Blueprint**.
3. Connect your `sentinel-voice` repository.
4. Render will read [`render.yaml`](file:///c:/Users/DELL/Downloads/Multimodal%20AI%20%20Assistant%20Fraud%20Verification/sentinel-voice/render.yaml) and automatically create:
   - **sentinel-voice-db**: A Managed PostgreSQL database.
   - **sentinel-voice-backend**: A FastAPI Web Service with WebSockets enabled.
5. Click **Apply**.
6. Once deployed, copy your backend URL (e.g. `https://sentinel-voice-backend.onrender.com`).

---

### Step 3: Deploy Frontend on Vercel
1. Go to your **Vercel Dashboard** ([vercel.com](https://vercel.com)).
2. Click **Add New...** ➔ **Project**.
3. Import your `sentinel-voice` GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, configure:
   - `NEXT_PUBLIC_API_URL` = `https://sentinel-voice-backend.onrender.com`
   - `NEXT_PUBLIC_WS_URL` = `wss://sentinel-voice-backend.onrender.com`
6. Click **Deploy**.
7. Vercel automatically deploys with the camera/mic permissions and headers defined in [`vercel.json`](file:///c:/Users/DELL/Downloads/Multimodal%20AI%20%20Assistant%20Fraud%20Verification/sentinel-voice/frontend/vercel.json).

---

## ⚡ Local Development Setup

### 1. Start the Backend (Port 8000)
```powershell
cd "backend"
.\.venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```
*(Or double-click `run_backend.bat`)*

### 2. Start the Frontend (Port 3000)
```powershell
cd "frontend"
npm run dev
```
*(Or double-click `run_frontend.bat`)*

- **Customer Servicing Portal**: `http://localhost:3000`
- **Supervisor SOC Dashboard**: `http://localhost:3000/admin`
- **Backend Swagger API Docs**: `http://localhost:8000/docs`

---

## 🧪 Interactive Test Scenarios

1. **Scenario 1: Autonomous Courtesy Fee Waiver (Approved)**
   - Select **Elena Rostova** (Tier 1 Verified).
   - Click the prompt chip: `"Waive my $35 overdraft fee"`.
   - **Result**: Biometrics pass (99.4%), Policy checks pass ($35 <= $50 ceiling), $35 is credited to balance in real time, and audit trace is logged.

2. **Scenario 2: Policy Ceiling Breach ($150 Fee Waiver - Rejected)**
   - Select **Elena Rostova**.
   - Click: `"Please waive my $150 credit card penalty fee"`.
   - **Result**: Deterministic Guardrail triggers violation: `Requested amount ($150.00) exceeds policy ceiling of $50.00`. Action is blocked before database write.

3. **Scenario 3: Presentation Attack / Face Spoof Injection (Escalated)**
   - Click **"Inject Synthetic Spoof Attack"** on the Biometric HUD.
   - Fraud risk immediately jumps to **64.8%** (> 15% threshold).
   - Bounding box turns crimson red, and an automatic **Warm Handoff** is triggered.
   - Navigate to `/admin` to view the session flagged in the Warm Transfer Queue and perform supervisor takeover.

4. **Scenario 4: High-Risk Tier 3 Customer Restriction**
   - Select **Marcus Vance** (Tier 3 High Risk).
   - Request any sensitive action (e.g. Card replacement or Credit limit increase).
   - **Result**: Guardrail blocks execution due to Tier 3 status and escalates session to human underwriter.
