# State Management, Memory Architecture & Ledger Persistence
## Project: SentinelVoice (Team Nexus)

---

## 1. Memory Tier Overview

In an enterprise autonomous servicing system, memory must be tiered based on lifecycle, sensitivity, and regulatory persistence requirements. A pure conversational memory (like a simple chat buffer) is insufficient when executing financial transactions.

SentinelVoice uses a **4-Tier Memory Architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SHORT-TERM EPISODIC MEMORY (In-Session WebSocket State)                  │
│    - Active session ID, client connection status                            │
│    - Rolling 30-frame biometric telemetry buffer (FPS, jitter, landmarks)    │
│    - Current speech recognition transcript and synthesized reply buffer      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. WORKING MEMORY (LangGraph Agent Execution Scratchpad)                    │
│    - PII-scrubbed user message & detected entity tags                        │
│    - Intent classification & proposed tool call payload                     │
│    - Deterministic guardrail evaluation state & violation list              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. LONG-TERM SEMANTIC MEMORY (Policy Vector Knowledge Base)                │
│    - Vectorized bank compliance policies (Fee waiver, Credit line, Freeze)  │
│    - Fast cosine similarity retrieval and relevance re-ranking              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. LONG-TERM RELATIONAL LEDGER (Managed PostgreSQL Database)                │
│    - Customer Profile & Balances (`users`)                                  │
│    - Servicing Session Lifecycles (`servicing_sessions`)                    │
│    - Biometric Telemetry & Fraud Decisions (`fraud_checks`)                 │
│    - Transactional Write Records (`account_actions`)                        │
│    - Immutable Compliance Trace (`audit_logs`)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Memory Tier Details

### Tier 1: Short-Term Episodic Memory
- **Lifecycle**: Duration of the live WebSocket connection (minutes).
- **Storage**: Client-side React state + FastAPI WebSocket connection memory.
- **Data Held**:
  * Active user context (`activeUser`: ID, tier, balances).
  * Video canvas HUD parameters (bounding box coordinates, laser scan position).
  * Real-time audio waveform amplitude and phase.
  * Latest frame telemetry (face detected, liveness score, acoustic jitter).

### Tier 2: Working Memory (Agent Scratchpad)
- **Lifecycle**: Single conversational turn (300ms–800ms).
- **Storage**: Python asynchronous turn dictionary.
- **Workflow State Flow**:
  1. `raw_user_message`: String input from audio transcript.
  2. `scrubbed_input`: Result from `pii_scrubber.scrub()`.
  3. `biometric_snapshot`: Current fraud risk score, liveness status, and confidence score.
  4. `proposed_action`: Tool intent (e.g., `{"action_type": "FEE_WAIVER", "amount": 35.0}`).
  5. `guardrail_result`: Output from `guardrail_engine.validate_action()`.
  6. `action_result`: Ledger write return payload (or rejection reason).
  7. `audit_traces`: Array of step-by-step reasoning nodes.

### Tier 3: Long-Term Semantic Memory (Policy RAG)
- **Lifecycle**: Static/Persistent knowledge updated by compliance officers.
- **Storage**: In-Memory Vector Store (`tools/rag_tools.py`) with cosine similarity indexing.
- **Documents Indexed**:
  * `POL-FEE-01`: Automated Fee Waiver Authorization Policy (max $50, 90-day interval).
  * `POL-CRD-02`: Credit Limit Increase & Adjustment Policy (max 25% adjustment).
  * `POL-SEC-03`: Lost/Damaged Card Reissuance & Fraud Freeze Policy.
  * `POL-ESC-04`: Human-in-the-Loop (HITL) Warm Transfer & Fraud Protocol.

### Tier 4: Long-Term Relational Ledger (PostgreSQL)
- **Lifecycle**: Permanent, immutable, and auditable.
- **Storage**: PostgreSQL with SQLAlchemy 2.0 Async Engine.
- **Data Integrity Invariants**:
  * `users.account_balance`: Only modified by verified `account_actions`.
  * `account_actions`: Records all transactions with timestamps and status.
  * `audit_logs`: **Append-only**. Records are never updated or deleted, providing strict non-repudiation for financial audits.

---

## 3. Database Schema Mapping

```sql
-- 1. Users Table (Customer Profiles)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    account_balance DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    credit_limit DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    risk_tier INTEGER NOT NULL DEFAULT 1,
    facial_embedding_hash VARCHAR(128),
    voice_print_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Servicing Sessions Table
CREATE TABLE servicing_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id),
    channel VARCHAR(50) NOT NULL DEFAULT 'WEBSOCKET_STREAM',
    session_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    sentiment_score DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 3. Fraud Checks Table (Biometric Telemetry)
CREATE TABLE fraud_checks (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES servicing_sessions(id),
    verification_type VARCHAR(60) NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    liveness_passed BOOLEAN NOT NULL,
    fraud_risk_score DOUBLE PRECISION NOT NULL,
    decision VARCHAR(50) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Account Actions Table (Financial Ledger)
CREATE TABLE account_actions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id),
    session_id VARCHAR(36) REFERENCES servicing_sessions(id),
    action_type VARCHAR(60) NOT NULL,
    requested_amount DOUBLE PRECISION,
    status VARCHAR(50) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Audit Logs Table (Compliance & LLM Reasoning)
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES servicing_sessions(id),
    user_id VARCHAR(36) REFERENCES users(id),
    tool_name VARCHAR(80) NOT NULL,
    policy_passed BOOLEAN NOT NULL,
    policy_rules_evaluated JSON NOT NULL,
    llm_reasoning_trace TEXT NOT NULL,
    raw_payload JSON NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. PII Protection & Data Sanitization Invariant

Before any text is written to `audit_logs.llm_reasoning_trace` or `audit_logs.raw_payload`:
1. The message passes through `pii_scrubber.scrub()`.
2. Any 16-digit card number is sanitized to `[REDACTED_CARD]`.
3. Any 9-digit SSN is sanitized to `[REDACTED_SSN]`.
4. Any CVV is sanitized to `[REDACTED_CVV]`.
5. Only sanitized tokens and authorized transaction amounts are persisted.
