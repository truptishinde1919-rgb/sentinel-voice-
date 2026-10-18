# Task Breakdown & Implementation Roadmap
## Project: SentinelVoice (Team Nexus)

---

## 1. Project Overview & Delivery Status

| Milestone | Phase | Scope | Status |
| :--- | :--- | :--- | :--- |
| **M1** | Phase 1 | Database Architecture & Relational Schema | ✅ **COMPLETED** |
| **M2** | Phase 2 | Biometrics, Vision & PII Scrubbing Engine | ✅ **COMPLETED** |
| **M3** | Phase 3 | LangGraph Agent & Deterministic Guardrails | ✅ **COMPLETED** |
| **M4** | Phase 4 | Omni-Channel Frontend Portal & SOC Dashboard | ✅ **COMPLETED** |
| **M5** | Phase 5 | Automated CI/CD & Cloud Deployment (Vercel + Render) | ✅ **COMPLETED** |
| **M6** | Phase 6 | Future Roadmap & Enterprise Scaling | 📋 **PLANNED** |

---

## 2. Completed Milestones & Work Breakdown

### Phase 1: Core Database Architecture & Seeds (Completed)
- [x] Design PostgreSQL relational schema in SQLAlchemy 2.0 async syntax.
- [x] Implement models:
  * `User`: Profile, balances, limits, risk tier, facial hash, voiceprint ID.
  * `ServicingSession`: Session ID, channel, status, sentiment score.
  * `FraudCheck`: Verification type, confidence, liveness passed, fraud risk, decision.
  * `AccountAction`: Action type, amount, execution status, timestamp.
  * `AuditLog`: Tool name, policy passed, evaluated rules (JSONB), trace, payload.
- [x] Implement dual database support: PostgreSQL production + SQLite local development fallback.
- [x] Implement automatic demo seed data: Elena Rostova (Tier 1), Sophia Chen (Tier 2), Marcus Vance (Tier 3).

### Phase 2: Security, Vision & Biometrics Layer (Completed)
- [x] Implement `BiometricEngine` (`security/biometrics.py`) for sub-frame facial tracking.
- [x] Implement dynamic bounding box coordinate generator with micro-jitter simulation.
- [x] Implement passive 2D/3D liveness scoring algorithm (blink detection, micro-pulse, anti-spoofing spectral shield).
- [x] Implement dynamic Composite Fraud Risk Score calculation (0–100%).
- [x] Implement `PIIScrubber` (`security/pii_scrubber.py`) with Microsoft Presidio and regex fallback for SSNs, card numbers, CVVs, emails, and phone numbers.

### Phase 3: LangGraph Agent & Deterministic Guardrails (Completed)
- [x] Implement `ServicingAgent` (`agents/servicing_agent.py`) state flow: input -> scrub -> biometric check -> intent reasoning -> policy RAG -> guardrails -> execute -> audit log.
- [x] Implement `PolicyVectorStore` (`tools/rag_tools.py`) for semantic policy retrieval.
- [x] Implement transactional tool layer (`tools/banking_tools.py`): fee waiver, credit limit adjustment, card replacement, balance inquiry.
- [x] Implement `DeterministicGuardrailEngine` (`agents/guardrails.py`):
  * $50 courtesy fee waiver ceiling.
  * 90-day fee waiver frequency limit.
  * 25% credit limit increase ceiling.
  * Tier 3 account restriction.
  * 15.0% fraud risk ceiling with automatic warm handoff trigger.

### Phase 4: Frontend Servicing Portal & Supervisor SOC (Completed)
- [x] Initialize Next.js 14 App Router project with TypeScript and Tailwind CSS.
- [x] Implement cybernetic dark-mode design system with glassmorphism and custom grid background (`globals.css`).
- [x] Build `AccountSummary.tsx` with Obsidian metal credit card visual, balance counter, and demo user switcher.
- [x] Build `BiometricOverlay.tsx` with live webcam stream, canvas HUD, bounding box corner brackets, laser sweep, and spoof attack toggle.
- [x] Build `VoiceWidget.tsx` with speech waveform canvas, Web Speech API mic input, and text-to-speech synthesis.
- [x] Build `AuditLogger.tsx` with real-time JSON trace logging and rule evaluation breakdown.
- [x] Build `/admin/page.tsx` for Supervisor SOC operations with active call cards, warm transfer queue alerts, and raw JSON trace inspector.

### Phase 5: Cloud Deployment & CI/CD Pipelines (Completed)
- [x] Configure root `.gitignore` ignoring virtualenvs, build artifacts, and SQLite databases.
- [x] Write `render.yaml` 1-Click Blueprint for Render Web Service + Managed PostgreSQL.
- [x] Write multi-stage production `Dockerfile` for containerized execution.
- [x] Write `vercel.json` with permissions-policy for camera/microphone and CORS overrides.
- [x] Configure GitHub Actions CI/CD workflow (`.github/workflows/deploy.yml`).
- [x] Initialize Git repository, commit all 37 files, and push to GitHub.
- [x] Deploy live frontend on Vercel: **`https://sentinel-voice-kx3d.vercel.app`**.
- [x] Deploy live backend & database on Render: **`https://sentinel-voice-backend-7u0v.onrender.com`**.

---

## 3. Future Roadmap (Phase 6: Enterprise Expansion)

- [ ] **Selective Forwarding Unit (SFU) WebRTC Media Server**: Implement LiveKit or Janus for multi-party supervisor audio/video barge-in.
- [ ] **Voice Biometrics Speaker Diarization**: Deep voiceprint embedding matching using Resemblyzer / PyAnnote.audio.
- [ ] **Vector Database Expansion**: Migrate in-memory policy search to managed Qdrant Cloud or pgvector for multi-tenant bank policy manuals.
- [ ] **FIDO2 / WebAuthn Hardware Key Fallback**: Allow customers to tap a YubiKey or touch biometric sensor on device when fraud risk triggers a secondary challenge.
- [ ] **Multi-Region Disaster Recovery**: Active-active database replication using Google Cloud Spanner or AWS Aurora Global Database.
