# Product Requirements Document (PRD)
## Project: SentinelVoice (Team Nexus)
### Topic: Multimodal AI Servicing Assistant with Real-Time Fraud Verification & Autonomous Action Execution

---

## 1. Executive Summary
**SentinelVoice** is an enterprise-grade AI customer servicing platform engineered by **Team Nexus**. The platform transforms modern contact centers by pairing real-time, low-latency speech-to-speech interaction with passive multimodal biometric verification (2D/3D facial liveness and acoustic voiceprint tracking) and deterministic transactional guardrails.

Unlike traditional IVR menus or unconstrained LLM chatbots, SentinelVoice executes high-frequency account transactions (courtesy fee waivers, credit limit reviews, lost card reissuances) autonomously while guaranteeing zero hallucinations through a hardcoded deterministic policy validation engine. Sensitive actions or anomalous biometric streams automatically trigger a sub-second warm handoff to human supervisor operators.

---

## 2. Problem Statement
1. **Queue Congestion & Servicing Costs**: Financial institutions spend billions fielding routine calls (fee waiver inquiries, balance checks, replacement cards) with average hold times exceeding 8 to 15 minutes.
2. **Synthetic Identity & Deepfake Fraud**: Voice cloning tools and generative AI video replay attacks can easily bypass legacy voice-recognition or knowledge-based authentication (mother's maiden name, last 4 of SSN).
3. **LLM Hallucinations in Financial Ledgers**: Pure generative LLMs cannot be trusted with write access to bank ledgers without strict, deterministic guardrails.
4. **Lack of Explainability & Compliance Auditability**: Regulators (CFPB, OCC, GDPR) require immutable, auditable traces explaining why financial actions were executed or denied.

---

## 3. Product Goals & Objectives
- **Sub-800ms Latency**: Deliver speech-to-speech response times under 800ms via WebSockets streaming and low-overhead audio synthesis.
- **Continuous Biometric Fraud Scoring**: Monitor facial match confidence, passive 2D/3D liveness, and voice harmonics continuously.
- **Deterministic Action Execution**: Guarantee that financial policies (e.g., $50 waiver cap, 1 waiver per 90 days, 25% credit limit cap) cannot be bypassed by prompt injection or model hallucination.
- **Dynamic Risk-Based Escalation**: If composite fraud risk exceeds 15.0%, immediately suspend autonomous actions and initiate a warm handoff to human supervisors.
- **100% Auditable Ledger Writes**: Log every LLM reasoning trace, biometric score, and policy evaluation to an immutable PostgreSQL compliance ledger.

---

## 4. User Personas

### Persona A: Verified Banking Customer (Elena Rostova)
- **Profile**: Tier 1 customer in good standing.
- **Goal**: Quickly resolve a $35 overdraft fee incurred due to an unexpected recurring subscription.
- **Experience**: Speaks naturally into the portal; camera passively verifies her identity within 400ms; the AI credits $35 back to her account instantly with zero hold time.

### Persona B: Compromised / Flagged User (Marcus Vance / Deepfake Attacker)
- **Profile**: Tier 3 customer or unauthorized party attempting a synthetic video replay attack to reissue a card to an alternate address.
- **Experience**: Passive liveness checks detect texture and spectral replay anomalies; dynamic fraud risk spikes to 64.8%; the system denies the action and escalates to a fraud specialist.

### Persona C: Compliance Supervisor & SOC Operator
- **Profile**: Bank supervisor monitoring live queue operations in the Security Operations Center.
- **Goal**: Intercept high-risk sessions, review policy violations, and inspect raw JSON audit traces to satisfy regulatory compliance.

---

## 5. Functional Requirements

### FR-1: Multimodal Omni-Channel Portal
- **FR-1.1**: Low-latency audio streaming over bidirectional WebSockets.
- **FR-1.2**: Speech recognition and speech synthesis (TTS) supporting natural conversational flow.
- **FR-1.3**: HTML5 Canvas camera overlay rendering real-time bounding box tracking, landmarks, and biometric telemetry.
- **FR-1.4**: Interactive account card dashboard reflecting live balance changes upon successful action execution.

### FR-2: Biometric Vision & Acoustic Engine
- **FR-2.1**: Face detection with real-time bounding box coordinate generation `[x, y, w, h]`.
- **FR-2.2**: 2D/3D passive liveness analysis scoring micro-pulse, blink rate, and texture variance.
- **FR-2.3**: Anti-spoofing detection identifying screen replay, static printouts, or synthetic generation.
- **FR-2.4**: Dynamic Composite Fraud Risk Score (0–100%) computed on every telemetry tick.

### FR-3: Deterministic Guardrails & Policy Engine
- **FR-3.1**: Pre-execution interception of all database write operations.
- **FR-3.2**: Courtesy Fee Waiver Policy: Max $50.00 ceiling, max 1 waiver per 90 days, Tier 1 or 2 accounts only.
- **FR-3.3**: Credit Limit Policy: Max 25% increase of existing limit, biometric confidence >= 85.0%, fraud risk <= 15.0%.
- **FR-3.4**: Card Replacement Policy: Facial match >= 90.0%, liveness passed, instant freeze of compromised card.

### FR-4: Human-in-the-Loop (HITL) Supervisor Center
- **FR-4.1**: Active call monitoring dashboard with real-time sentiment and risk tiers.
- **FR-4.2**: Warm Handoff Queue with audio-visual alerts when fraud risk > 15.0%.
- **FR-4.3**: Supervisor Takeover button to assume audio/video session control.
- **FR-4.4**: Compliance Audit Trail table with raw JSON modal inspector.

### FR-5: PII Scrubbing & Security
- **FR-5.1**: Automatic redaction of SSNs, card numbers, CVVs, phone numbers, and email addresses prior to reasoning logging.
- **FR-5.2**: Microsoft Presidio integration with high-speed regex fallback guard.

---

## 6. Non-Functional Requirements
- **Performance**: Round-trip speech response < 800ms; canvas HUD frame rate >= 30 FPS.
- **Reliability & Availability**: 99.9% uptime; stateless backend architecture with PostgreSQL persistence.
- **Security**: TLS 1.3 encryption in transit; WSS encrypted streaming; zero unmasked PII in logs.
- **Browser Compatibility**: Fully responsive on modern Chromium, WebKit, and Gecko browsers.

---

## 7. Success Metrics & KPIs
1. **Autonomous Resolution Rate (ARR)**: >= 90% for standard Tier 1/2 courtesy requests.
2. **Fraud Detection Accuracy**: 100% interception of simulated deepfake/replay attacks.
3. **Average Servicing Latency**: < 450ms end-to-end.
4. **Zero Guardrail Breaches**: 0% unauthorized database writes exceeding policy limits.
