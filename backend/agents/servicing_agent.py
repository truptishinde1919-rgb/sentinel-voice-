import uuid
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, ServicingSession, FraudCheck, AuditLog, AccountAction
from security.pii_scrubber import pii_scrubber
from security.biometrics import biometric_engine
from tools.banking_tools import banking_tools
from tools.rag_tools import policy_kb
from agents.guardrails import guardrail_engine

class ServicingAgent:
    """
    SentinelVoice Multi-Turn Servicing Agent with LangGraph-style state flow:
    [Input] -> [PII Scrub] -> [Biometric Risk Analysis] -> [Intent Reasoning & Policy RAG]
            -> [Deterministic Guardrail Validation] -> [Action Tool Execution] -> [Audit Trace Logging]
    """

    async def run_turn(
        self,
        db: AsyncSession,
        session_id: str,
        user_id: str,
        user_message: str,
        biometric_telemetry: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        audit_traces: List[Dict[str, Any]] = []

        # Step 1: PII Scrubbing
        scrub_result = pii_scrubber.scrub(user_message)
        clean_text = scrub_result["scrubbed_text"]
        detected_pii = scrub_result["detected_entities"]
        
        audit_traces.append({
            "step": "PII_SCRUBBING",
            "detected_pii": detected_pii,
            "engine": scrub_result.get("engine", "presidio_or_regex"),
            "scrubbed_input": clean_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        # Fetch User and Session
        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        if not user:
            return {
                "reply": "I am sorry, but your account profile could not be retrieved. Transferring to customer service.",
                "action_executed": None,
                "fraud_risk_score": 100.0,
                "warm_handoff": True,
                "audit_trace": audit_traces,
            }

        session_res = await db.execute(select(ServicingSession).where(ServicingSession.id == session_id))
        session = session_res.scalar_one_or_none()
        if not session:
            session = ServicingSession(
                id=session_id,
                user_id=user_id,
                channel="WEBRTC_VOICE_STREAM",
                session_status="ACTIVE",
                sentiment_score=0.85,
            )
            db.add(session)
            await db.commit()

        # Step 2: Biometric Telemetry & Fraud Risk Evaluation
        telemetry = biometric_telemetry or biometric_engine.verify_frame(
            user_risk_tier=user.risk_tier
        )
        fraud_risk = telemetry.get("fraud_risk_score", 4.5)
        liveness_passed = telemetry.get("liveness_passed", True)
        confidence = telemetry.get("confidence_score", 95.0)

        # Record Fraud Check in DB
        fraud_check_record = FraudCheck(
            id=f"chk_{uuid.uuid4().hex[:12]}",
            session_id=session_id,
            verification_type="FACIAL_LIVENESS_AND_VOICE",
            confidence_score=confidence,
            liveness_passed=liveness_passed,
            fraud_risk_score=fraud_risk,
            decision=telemetry.get("decision", "PASSED"),
            performed_at=datetime.now(timezone.utc),
        )
        db.add(fraud_check_record)

        audit_traces.append({
            "step": "BIOMETRIC_RISK_ASSESSMENT",
            "confidence_score": confidence,
            "liveness_passed": liveness_passed,
            "fraud_risk_score": fraud_risk,
            "decision": telemetry.get("decision", "PASSED"),
            "anti_spoofing": telemetry.get("anti_spoofing_flags", []),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        # Step 3: Intent & Action Classification
        lower_msg = clean_text.lower()
        proposed_action: Optional[Dict[str, Any]] = None

        # Check for Fee Waiver intent
        if any(w in lower_msg for w in ["waive", "waiver", "refund", "overdraft fee", "late fee", "reverse fee"]):
            amount_match = re.search(r'\$?(\d+(?:\.\d{2})?)', clean_text)
            requested_amt = float(amount_match.group(1)) if amount_match else 35.00
            proposed_action = {
                "action_type": "FEE_WAIVER",
                "amount": requested_amt,
                "reason": "Customer requested fee reversal during voice servicing",
            }
        # Check for Credit Limit Increase intent
        elif any(w in lower_msg for w in ["credit limit", "increase limit", "credit line", "raise my limit"]):
            amount_match = re.search(r'\$?(\d+(?:\.\d{2})?)', clean_text)
            requested_amt = float(amount_match.group(1)) if amount_match else 1000.00
            proposed_action = {
                "action_type": "CREDIT_LIMIT_INCREASE",
                "amount": requested_amt,
                "reason": "Customer requested credit line increase",
            }
        # Check for Card Replacement intent
        elif any(w in lower_msg for w in ["replace card", "new card", "lost my card", "stolen card", "damaged card", "card replacement"]):
            proposed_action = {
                "action_type": "CARD_REPLACEMENT",
                "amount": 0.0,
                "reason": "Customer requested card reissuance due to lost/compromised card",
            }
        # Check for Balance Inquiry intent
        elif any(w in lower_msg for w in ["balance", "how much money", "account standing", "funds", "recent transactions"]):
            proposed_action = {
                "action_type": "BALANCE_INQUIRY",
                "amount": 0.0,
                "reason": "Account balance inquiry",
            }

        # Step 4: Policy RAG Search
        relevant_policies = policy_kb.search_policy(clean_text, top_k=2)
        audit_traces.append({
            "step": "POLICY_RAG_RETRIEVAL",
            "matched_policies": [p["id"] + " (" + p["title"] + ")" for p in relevant_policies],
            "query": clean_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        action_result: Optional[Dict[str, Any]] = None
        guardrail_result: Optional[Dict[str, Any]] = None
        warm_handoff = False
        reply = ""

        # Step 5: Deterministic Guardrail Validation & Execution
        if proposed_action:
            action_type = proposed_action["action_type"]

            if action_type == "BALANCE_INQUIRY":
                account_info = await banking_tools.get_account_details(db, user_id)
                reply = (
                    f"Hello {user.full_name.split()[0]}. Your current account balance is "
                    f"${user.account_balance:,.2f}, with a total credit limit of ${user.credit_limit:,.2f}. "
                    f"Your account status is active with biometric tier {user.risk_tier} verification."
                )
                action_result = account_info
            else:
                # Run deterministic guardrail validation
                guardrail_result = await guardrail_engine.validate_action(
                    db=db,
                    user=user,
                    action_type=action_type,
                    requested_amount=proposed_action.get("amount"),
                    biometric_telemetry=telemetry,
                    session=session,
                )

                audit_traces.append({
                    "step": "GUARDRAIL_POLICY_EVALUATION",
                    "action_type": action_type,
                    "policy_passed": guardrail_result["policy_passed"],
                    "rules_evaluated": guardrail_result["rules_evaluated"],
                    "violations": guardrail_result["violations"],
                    "decision": guardrail_result["decision"],
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

                if guardrail_result["policy_passed"]:
                    # Execute tool call
                    if action_type == "FEE_WAIVER":
                        res = await banking_tools.execute_fee_waiver(
                            db, user_id, session_id, proposed_action["amount"], proposed_action["reason"]
                        )
                        reply = (
                            f"I have successfully authorized and credited a ${proposed_action['amount']:.2f} "
                            f"fee waiver back to your account. Your new balance is ${res['new_balance']:,.2f}."
                        )
                        action_result = res
                    elif action_type == "CREDIT_LIMIT_INCREASE":
                        res = await banking_tools.execute_credit_limit_increase(
                            db, user_id, session_id, proposed_action["amount"]
                        )
                        reply = (
                            f"Great news! Your credit limit increase of ${proposed_action['amount']:,.2f} "
                            f"has been approved and applied. Your new credit limit is ${res['new_limit']:,.2f}."
                        )
                        action_result = res
                    elif action_type == "CARD_REPLACEMENT":
                        res = await banking_tools.execute_card_replacement(
                            db, user_id, session_id
                        )
                        reply = (
                            f"Your previous card has been immediately frozen for your protection. "
                            f"A replacement Contactless Visa ending in {res['new_card_last4']} has been issued "
                            f"via {res['shipping_speed']} to your address on file."
                        )
                        action_result = res
                else:
                    # Policy validation failed
                    violation_summary = " ".join(guardrail_result["violations"])
                    if guardrail_result["requires_warm_transfer"]:
                        warm_handoff = True
                        session.session_status = "WARM_TRANSFER_TRIGGERED"
                        reply = (
                            f"I understand your request, but due to our security and fraud verification protocol "
                            f"({violation_summary}), I cannot process this autonomously. "
                            f"I am seamlessly transferring your session to a Nexus Senior Specialist right now."
                        )
                    else:
                        reply = (
                            f"I was unable to execute that request because it exceeds our automated banking policy: "
                            f"{violation_summary} Would you like me to connect you with an account supervisor?"
                        )

            # Step 6: Create Audit Log Entry
            reasoning_summary = (
                f"User requested {action_type} for ${proposed_action.get('amount', 0.0):.2f}. "
                f"Biometric Confidence={confidence}%, FraudRisk={fraud_risk}%. "
                f"Guardrail Decision={guardrail_result['decision'] if guardrail_result else 'PASSED_READONLY'}."
            )

            audit_log = AuditLog(
                id=f"aud_{uuid.uuid4().hex[:12]}",
                session_id=session_id,
                user_id=user_id,
                tool_name=action_type,
                policy_passed=guardrail_result["policy_passed"] if guardrail_result else True,
                policy_rules_evaluated=guardrail_result["rules_evaluated"] if guardrail_result else [],
                llm_reasoning_trace=reasoning_summary,
                raw_payload={
                    "proposed_action": proposed_action,
                    "action_result": action_result,
                    "biometric_telemetry": telemetry,
                    "clean_input": clean_text,
                },
                created_at=datetime.now(timezone.utc),
            )
            db.add(audit_log)
            await db.commit()

        else:
            # General conversation or policy question
            if relevant_policies and relevant_policies[0]["relevance_score"] > 0.4:
                top_p = relevant_policies[0]
                reply = (
                    f"Regarding your inquiry about {top_p['category']}: {top_p['content']} "
                    f"Let me know if you would like me to review your specific account or execute this action."
                )
            else:
                reply = (
                    f"Hello! I am Sentinel, your Nexus autonomous servicing assistant. "
                    f"I can assist you with fee waiver credits up to $50, credit limit reviews, "
                    f"card replacements, or balance inquiries while keeping your account secure."
                )

        await db.commit()
        await db.refresh(user)

        return {
            "reply": reply,
            "user": user.to_dict(),
            "proposed_action": proposed_action,
            "action_executed": action_result,
            "guardrail_result": guardrail_result,
            "fraud_risk_score": fraud_risk,
            "biometric_telemetry": telemetry,
            "warm_handoff": warm_handoff,
            "audit_trace": audit_traces,
        }

servicing_agent = ServicingAgent()
