from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from database.models import User, ServicingSession
from tools.banking_tools import banking_tools

class DeterministicGuardrailEngine:
    """
    Hardcoded Deterministic Policy Engine.
    Validates any proposed transactional update BEFORE database writes occur.
    Ensures that LLM hallucinations cannot bypass bank compliance, financial limits,
    or biometric security rules.
    """

    async def validate_action(
        self,
        db: AsyncSession,
        user: User,
        action_type: str,
        requested_amount: Optional[float] = None,
        biometric_telemetry: Optional[Dict[str, Any]] = None,
        session: Optional[ServicingSession] = None,
    ) -> Dict[str, Any]:
        rules_evaluated: List[Dict[str, Any]] = []
        violations: List[str] = []
        requires_warm_transfer = False

        bio = biometric_telemetry or {}
        confidence = bio.get("confidence_score", 95.0)
        liveness_passed = bio.get("liveness_passed", True)
        fraud_risk = bio.get("fraud_risk_score", 4.0)

        # Rule 1: Biometric Verification Policy
        rule_bio = {
            "rule_id": "GUARD-BIO-01",
            "name": "Biometric Authenticity & Liveness Check",
            "expected": f"Confidence >= {settings.MIN_BIOMETRIC_CONFIDENCE}% and Liveness = True",
            "actual": f"Confidence: {confidence}%, Liveness: {liveness_passed}",
            "passed": confidence >= settings.MIN_BIOMETRIC_CONFIDENCE and liveness_passed,
        }
        rules_evaluated.append(rule_bio)
        if not rule_bio["passed"]:
            violations.append(
                f"Biometric verification failed: Confidence {confidence}% (req {settings.MIN_BIOMETRIC_CONFIDENCE}%), "
                f"Liveness passed: {liveness_passed}"
            )
            requires_warm_transfer = True

        # Rule 2: Dynamic Fraud Risk Score Policy
        rule_risk = {
            "rule_id": "GUARD-RISK-02",
            "name": "Dynamic Fraud Risk Threshold",
            "expected": f"Fraud Risk <= {settings.FRAUD_RISK_THRESHOLD}%",
            "actual": f"Fraud Risk: {fraud_risk}%",
            "passed": fraud_risk <= settings.FRAUD_RISK_THRESHOLD,
        }
        rules_evaluated.append(rule_risk)
        if not rule_risk["passed"]:
            violations.append(
                f"Dynamic fraud risk ({fraud_risk}%) exceeds autonomous execution threshold ({settings.FRAUD_RISK_THRESHOLD}%)"
            )
            requires_warm_transfer = True

        # Rule 3: Account Risk Tier Eligibility
        rule_tier = {
            "rule_id": "GUARD-TIER-03",
            "name": "Customer Risk Tier Validation",
            "expected": f"User Risk Tier <= {settings.MAX_ALLOWED_RISK_TIER_FOR_ACTIONS}",
            "actual": f"User Risk Tier: {user.risk_tier}",
            "passed": user.risk_tier <= settings.MAX_ALLOWED_RISK_TIER_FOR_ACTIONS,
        }
        rules_evaluated.append(rule_tier)
        if not rule_tier["passed"]:
            violations.append(
                f"User account is classified as Tier {user.risk_tier} (High Risk). Autonomous self-service is restricted."
            )
            requires_warm_transfer = True

        # Rule 4: Action-Specific Financial Ceilings
        if action_type == "FEE_WAIVER":
            amount = requested_amount or 0.0
            rule_fee_amount = {
                "rule_id": "GUARD-FEE-04A",
                "name": "Max Fee Waiver Amount Ceiling",
                "expected": f"Amount <= ${settings.MAX_WAIVER_AMOUNT:.2f}",
                "actual": f"Amount: ${amount:.2f}",
                "passed": amount <= settings.MAX_WAIVER_AMOUNT,
            }
            rules_evaluated.append(rule_fee_amount)
            if not rule_fee_amount["passed"]:
                violations.append(
                    f"Requested fee waiver amount (${amount:.2f}) exceeds policy ceiling of ${settings.MAX_WAIVER_AMOUNT:.2f}."
                )

            # Frequency check (1 waiver per 90 days)
            recent_waivers = await banking_tools.get_recent_waiver_count(db, user.id, settings.MAX_WAIVER_DAYS_INTERVAL)
            rule_fee_freq = {
                "rule_id": "GUARD-FEE-04B",
                "name": "Fee Waiver 90-Day Frequency Limit",
                "expected": f"Waivers in last {settings.MAX_WAIVER_DAYS_INTERVAL} days == 0",
                "actual": f"Waivers found: {recent_waivers}",
                "passed": recent_waivers == 0,
            }
            rules_evaluated.append(rule_fee_freq)
            if not rule_fee_freq["passed"]:
                violations.append(
                    f"Customer has already received {recent_waivers} courtesy waiver within the preceding {settings.MAX_WAIVER_DAYS_INTERVAL} days."
                )

        elif action_type == "CREDIT_LIMIT_INCREASE":
            increase_amount = requested_amount or 0.0
            max_allowed_increase = user.credit_limit * (settings.MAX_CREDIT_LIMIT_INCREASE_PCT / 100.0)
            rule_credit_limit = {
                "rule_id": "GUARD-CRD-05",
                "name": "Max 25% Credit Limit Increase Ceiling",
                "expected": f"Increase <= ${max_allowed_increase:.2f} (25% of current ${user.credit_limit:.2f})",
                "actual": f"Requested Increase: ${increase_amount:.2f}",
                "passed": increase_amount <= max_allowed_increase and increase_amount > 0,
            }
            rules_evaluated.append(rule_credit_limit)
            if not rule_credit_limit["passed"]:
                violations.append(
                    f"Requested limit increase (${increase_amount:.2f}) exceeds maximum allowable 25% adjustment (${max_allowed_increase:.2f})."
                )

        elif action_type == "CARD_REPLACEMENT":
            rule_card_bio = {
                "rule_id": "GUARD-CARD-06",
                "name": "Card Replacement Enhanced Security Verification",
                "expected": f"Biometric Confidence >= 90.0% and Fraud Risk <= 10.0%",
                "actual": f"Confidence: {confidence}%, Risk: {fraud_risk}%",
                "passed": confidence >= 90.0 and fraud_risk <= 10.0,
            }
            rules_evaluated.append(rule_card_bio)
            if not rule_card_bio["passed"]:
                violations.append(
                    "Card replacement requires elevated biometric confidence (>=90%) and ultra-low risk (<=10%)."
                )
                requires_warm_transfer = True

        policy_passed = len(violations) == 0

        return {
            "allowed": policy_passed,
            "policy_passed": policy_passed,
            "violations": violations,
            "rules_evaluated": rules_evaluated,
            "requires_warm_transfer": requires_warm_transfer,
            "decision": "APPROVED" if policy_passed else ("WARM_TRANSFER_TRIGGERED" if requires_warm_transfer else "REJECTED_BY_POLICY")
        }

guardrail_engine = DeterministicGuardrailEngine()
