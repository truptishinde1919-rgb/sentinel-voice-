# Deterministic Guardrails & Banking Policy Rules
## Project: SentinelVoice (Team Nexus)

---

## 1. Philosophy: Deterministic Enforcement vs. LLM Hallucinations

In banking and regulated financial environments, autonomous AI agents cannot rely solely on prompt engineering or system instructions to enforce business rules. An unconstrained LLM is vulnerable to jailbreaks, cognitive drift, and hallucinations that could result in unauthorized ledger writes (e.g., waiving a $5,000 charge or granting a $50,000 credit line increase).

**SentinelVoice enforces a strict architectural boundary**:
> The LLM / Agent is permitted to formulate **proposals**, but **ZERO** database write operations can execute without passing the **Hardcoded Deterministic Policy Engine (`guardrails.py`)**.

```
[ Customer Voice Input ]
           │
           ▼
[ LLM Agent Reasoning ] ──(Proposes: Waive $150 Fee)──┐
                                                        ▼
                                           [ Deterministic Guardrail ]
                                           - Is Amount <= $50? ❌ FALSE
                                                        │
                                     ┌──────────────────┴──────────────────┐
                                     ▼                                     ▼
                            [ Action BLOCKED ]                   [ Audit Log Written ]
                         Database Write Aborted             Violation: GUARD-FEE-04A
```

---

## 2. Complete Guardrail Rule Catalog

### Rule 1: `GUARD-BIO-01` — Biometric Authenticity & Passive Liveness Check
- **Category**: Identity Verification & Anti-Spoofing
- **Threshold / Expectation**:
  * Facial Match Confidence $\ge 85.0\%$
  * Passive 2D/3D Liveness = `True` ($\text{Score} \ge 75.0\%$)
  * Anti-spoofing flags contain no replay or synthetic indicators.
- **Evaluation Logic**: If the customer's face is obscured, confidence drops below 85%, or a static image/replay attack is detected, the check fails.
- **Enforcement Action**: Immediately aborts transactional tool execution and flags session for supervisor review.

---

### Rule 2: `GUARD-RISK-02` — Dynamic Composite Fraud Risk Ceiling
- **Category**: Fraud Prevention & Session Integrity
- **Threshold / Expectation**:
  * $\text{Composite Fraud Risk Score} \le 15.0\%$
- **Evaluation Logic**: Dynamic risk is calculated on every audio/video tick by factoring biometric confidence deficit, liveness flags, voice acoustic jitter/shimmer, customer risk tier, and requested transaction magnitude.
- **Enforcement Action**:
  * If $\text{Risk} \le 15.0\%$: Autonomous execution approved.
  * If $15.0\% < \text{Risk} \le 35.0\%$: Autonomous actions suspended; secondary challenge required.
  * If $\text{Risk} > 35.0\%$: Immediate warm handoff triggered; session transferred to supervisor queue.

---

### Rule 3: `GUARD-TIER-03` — Customer Risk Tier Eligibility
- **Category**: Customer Account Governance
- **Threshold / Expectation**:
  * $\text{User Risk Tier} \le 2$ (Tier 1 = Low Risk, Tier 2 = Standard)
- **Evaluation Logic**: Tier 3 accounts (accounts under fraud investigation, past chargeback abuse, or elevated credit risk) are barred from autonomous self-service ledger modifications.
- **Enforcement Action**: Blocks fee waivers, credit limit increases, and card reissuances. Informs user and routes to human account representative.

---

### Rule 4: `GUARD-FEE-04A` — Max Courtesy Fee Waiver Amount Ceiling
- **Category**: Financial Ledger Protection
- **Threshold / Expectation**:
  * $\text{Requested Waiver Amount} \le \$50.00\text{ USD}$
- **Evaluation Logic**: Autonomous fee reversals (overdraft fee, late fee, wire fee) are capped at a strict hard ceiling of $50.00.
- **Enforcement Action**: Any request exceeding $50.00 (e.g., $75, $150) is deterministically rejected. The customer is informed of the policy cap and offered human escalation.

---

### Rule 5: `GUARD-FEE-04B` — Fee Waiver 90-Day Frequency Limit
- **Category**: Courtesy Policy Abuse Prevention
- **Threshold / Expectation**:
  * Number of executed fee waivers within preceding 90 days $= 0$
- **Evaluation Logic**: Queries the `account_actions` table for `action_type = 'FEE_WAIVER'` and `status = 'EXECUTED'` where `executed_at >= now - 90 days`.
- **Enforcement Action**: If a past waiver is found, the current waiver is blocked. Prevents repeat fee reversals without managerial approval.

---

### Rule 6: `GUARD-CRD-05` — Maximum 25% Credit Limit Adjustment
- **Category**: Underwriting & Credit Risk Control
- **Threshold / Expectation**:
  * $\text{Requested Limit Increase} \le \text{Current Credit Limit} \times 0.25$
  * Account Age $\ge 6\text{ months}$
- **Evaluation Logic**: For a customer with a $12,500 limit, the maximum autonomous increase is $\$3,125.00$ ($12,500 \times 0.25$).
- **Enforcement Action**: Requests exceeding 25% are rejected and routed to a human credit underwriter for full financial statement review.

---

### Rule 7: `GUARD-CARD-06` — Card Replacement Enhanced Security
- **Category**: Card Security & Compromise Protocol
- **Threshold / Expectation**:
  * Facial Match Confidence $\ge 90.0\%$
  * Fraud Risk Score $\le 10.0\%$
  * Passive Liveness = `True`
- **Evaluation Logic**: Replacing a debit/credit card carries high risk of interception or account takeover. Enhanced biometric thresholds are required.
- **Enforcement Action**:
  * Previous card number is instantly marked `FROZEN_AND_DEACTIVATED`.
  * New card is dispatched via expedited delivery **only** to the verified billing address on file.

---

## 3. Decision Matrix Summary

| Action Type | Max Amount | Frequency | Required Biometric Match | Max Fraud Risk | Max Allowed Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Balance Inquiry** | N/A | Unlimited | $\ge 70\%$ | $\le 25\%$ | Tier 3 |
| **Fee Waiver** | $\$50.00$ | 1 per 90 Days | $\ge 85\%$ | $\le 15\%$ | Tier 2 |
| **Credit Increase** | $+25\%$ | 1 per 180 Days | $\ge 85\%$ | $\le 15\%$ | Tier 2 |
| **Card Replace** | N/A | 1 per 30 Days | $\ge 90\%$ | $\le 10\%$ | Tier 2 |

---

## 4. Regulatory Compliance & Audit Traceability
Every guardrail evaluation produces a structured audit record stored in PostgreSQL:
- **`tool_name`**: The target action (e.g., `FEE_WAIVER`).
- **`policy_passed`**: Boolean (`true`/`false`).
- **`policy_rules_evaluated`**: Complete JSON array detailing each rule ID, expected condition, actual value, and individual pass/fail status.
- **`llm_reasoning_trace`**: Natural language summary of model reasoning and decision factors.
- **`raw_payload`**: Scrubbed input and output parameters for compliance examiners.
