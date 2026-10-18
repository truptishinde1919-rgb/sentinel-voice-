# System Architecture & Technical Specifications
## Project: SentinelVoice (Team Nexus)

---

## 1. High-Level Architecture Overview

SentinelVoice is structured into an enterprise multi-tier architecture combining low-latency edge rendering, asynchronous streaming WebSockets, a LangGraph-style agentic workflow, a deterministic pre-execution policy engine, and an immutable PostgreSQL compliance audit store.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT TIER (Next.js 14)                        │
│                                                                             │
│   ┌─────────────────────────┐  ┌───────────────────────┐  ┌─────────────┐   │
│   │   Biometric Vision HUD  │  │  Voice Waveform / TTS │  │  Card &     │   │
│   │   - HTML5 Canvas API    │  │  - Web Speech API     │  │  Account UI │   │
│   │   - Webcam Video Stream │  │  - WebSockets Client  │  │  - Live HUD │   │
│   └────────────┬────────────┘  └───────────┬───────────┘  └──────┬──────┘   │
└────────────────┼───────────────────────────┼─────────────────────┼──────────┘
                 │ Frame Telemetry           │ Audio Transcript    │
                 ▼                           ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EDGE & INGESTION GATEWAY                           │
│     - Vercel Edge Network (Permissions-Policy: camera/mic, CORS)            │
│     - TLS 1.3 / WSS Reverse Proxy (Render Ingress)                          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BACKEND APPLICATION TIER (FastAPI)                    │
│                                                                             │
│   ┌───────────────────────────┐         ┌───────────────────────────────┐   │
│   │ Security & Biometrics     │         │ PII Scrubbing Engine          │   │
│   │ - 2D/3D Passive Liveness  │         │ - Microsoft Presidio          │   │
│   │ - Face Match Confidence   │         │ - Regex Fallback Guard        │   │
│   │ - Dynamic Risk (0-100%)   │         │ - Sensitive Token Masking     │   │
│   └─────────────┬─────────────┘         └───────────────┬───────────────┘   │
│                 │                                       │                   │
│                 └───────────────────┬───────────────────┘                   │
│                                     ▼                                       │
│                ┌─────────────────────────────────────────┐                  │
│                │      LangGraph Multi-Turn Agent         │                  │
│                │      - Session State Coordinator        │                  │
│                │      - Policy RAG Vector Search         │                  │
│                │      - Tool Action Intent Formulation   │                  │
│                └────────────────────┬────────────────────┘                  │
│                                     │                                       │
│                                     ▼                                       │
│                ┌─────────────────────────────────────────┐                  │
│                │  Deterministic Guardrails Policy Engine │                  │
│                │  - Hardcoded Banking Ceilings ($50 Fee) │                  │
│                │  - 90-Day Interval Validation           │                  │
│                │  - Dynamic Fraud Risk Check (<= 15%)    │                  │
│                └────────────────────┬────────────────────┘                  │
│                                     │                                       │
│                      ┌──────────────┴──────────────┐                        │
│                      ▼ (Approved)                  ▼ (Violated / Risk >15%) │
│         ┌─────────────────────────┐    ┌─────────────────────────────────┐  │
│         │ Banking Tools Execution │    │ Human-in-the-Loop Escalation    │  │
│         │ - Ledger Balance Update │    │ - Warm Transfer Trigger         │  │
│         │ - Card Deactivation     │    │ - Supervisor WebSocket Broadcast│  │
│         └────────────┬────────────┘    └────────────────┬────────────────┘  │
└──────────────────────┼──────────────────────────────────┼───────────────────┘
                       │                                  │
                       ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE & AUDIT TIER                            │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Managed PostgreSQL Database (SQLAlchemy 2.0 Async Engine)            │   │
│   │ - users               : Profile, Balances, Risk Tiers, Biometric Hash│   │
│   │ - servicing_sessions  : Channel, Status, Sentiment Scores           │   │
│   │ - fraud_checks        : Confidence, Liveness, Decision Logs         │   │
│   │ - account_actions     : Transactional Records & Amounts             │   │
│   │ - audit_logs          : Immutable JSONB Policy Evaluations & Traces │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-End Sequence Diagram

```
User (Browser)          FastAPI Gateway          Biometric Engine          Guardrail Engine          PostgreSQL
     │                         │                         │                         │                      │
     │── 1. Voice Utterance ──>│                         │                         │                      │
     │── 2. Video Frame HUD ──>│── Verify Frame ────────>│                         │                      │
     │                         │<─ Liveness & Risk (4%) ─│                         │                      │
     │                         │                                                   │                      │
     │                         │── 3. Scrub PII (Presidio/Regex)                   │                      │
     │                         │── 4. Formulate Action (Fee Waiver $35)            │                      │
     │                         │                                                   │                      │
     │                         │── 5. Validate Action ────────────────────────────>│                      │
     │                         │                                                   │── 6. Check Past ────>│
     │                         │                                                   │<─ 0 in 90 Days ──────│
     │                         │                                                   │                      │
     │                         │<─ Policy Result: APPROVED (Passed all 4 rules) ───│                      │
     │                         │                                                   │                      │
     │                         │── 7. Execute Balance Credit (+$35.00) ──────────────────────────────────>│
     │                         │── 8. Commit Immutable Audit Log (JSONB Trace) ──────────────────────────>│
     │                         │                                                                          │
     │<─ 9. Audio Stream Reply ┤                                                                          │
     │   & Balance Update HUD  │                                                                          │
     │                         │── 10. Broadcast Telemetry ──────────────────────────────────────────────>│
     │                         │       (Supervisor SOC Dashboard /ws/supervisor)                          │
```

---

## 3. Component Deep Dive

### 3.1 Client Tier (Next.js 14 App Router)
- **VoiceWidget (`/components/VoiceWidget.tsx`)**:
  - WebSockets streaming audio handler with sub-400ms latency.
  - HTML5 Canvas sine/frequency waveform visualizer reflecting live speaking/listening states.
  - Speech synthesis via Web Speech API with fallback text chat and quick prompt chips.
- **BiometricOverlay (`/components/BiometricOverlay.tsx`)**:
  - Live webcam stream via `navigator.mediaDevices.getUserMedia` with fallback simulated stream.
  - Real-time HUD canvas rendering facial landmarks, bounding box coordinates, and laser sweep lines.
  - "Inject Synthetic Spoof Attack" button to demonstrate real-time fraud escalation.
- **AccountSummary (`/components/AccountSummary.tsx`)**:
  - Obsidian metal card visual with contactless wave, EMV chip, cardholder details, and live balance pulse.
  - Customer profile switcher (Elena Rostova, Sophia Chen, Marcus Vance).
- **AuditLogger (`/components/AuditLogger.tsx`)**:
  - Real-time JSON trace logging of multi-turn reasoning and rule evaluations.
  - Interactive tabs (All, Guardrails, Biometrics, Raw JSON) with 1-click clipboard export.

### 3.2 Security & Vision Tier
- **Biometric Engine (`/security/biometrics.py`)**:
  - Passive 2D/3D liveness analysis scoring micro-pulse, eye blink, and anti-spoofing flags.
  - Composite Dynamic Fraud Risk algorithm:
    $$\text{Risk} = \text{Base} + \Delta_{\text{Confidence}} + \text{Penalty}_{\text{Liveness}} + \text{Penalty}_{\text{Acoustics}} + \text{Tier}_{\text{Risk}} + \text{Action}_{\text{Sensitivity}}$$
- **PII Scrubber (`/security/pii_scrubber.py`)**:
  - Scans user prompts and agent traces for SSNs, credit card numbers, CVVs, phone numbers, and emails.
  - Uses Microsoft Presidio with regex fallback protection.

### 3.3 Agentic Orchestration & Deterministic Guardrails
- **Servicing Agent (`/agents/servicing_agent.py`)**:
  - Coordinates state: input -> PII scrub -> biometric telemetry -> policy RAG -> guardrail validation -> tool execution -> audit log.
- **Deterministic Policy Engine (`/agents/guardrails.py`)**:
  - Intercepts all database write actions before execution.
  - Enforces hard financial caps:
    * Fee waivers: $\le \$50.00$, max 1 per 90 days.
    * Credit limit increase: $\le 25\%$ of current limit.
    * Card replacement: Biometric confidence $\ge 90\%$, fraud risk $\le 10\%$.
    * Dynamic fraud risk: If $> 15.0\%$, halts execution and triggers warm handoff.

### 3.4 Persistence Tier (PostgreSQL)
- Built with async SQLAlchemy 2.0 and `aiosqlite`/`asyncpg`.
- Tables: `users`, `servicing_sessions`, `fraud_checks`, `account_actions`, `audit_logs`.
- Automatic table creation and demo seeding upon server startup.
