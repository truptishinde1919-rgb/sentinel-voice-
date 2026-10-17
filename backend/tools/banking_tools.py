import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, AccountAction, ServicingSession

class BankingTools:
    """
    Transactional tool execution layer for SentinelVoice.
    All write operations are designed to be invoked ONLY after
    passing Deterministic Guardrail Policy Engine validation.
    """

    @staticmethod
    async def get_account_details(db: AsyncSession, user_id: str) -> Dict[str, Any]:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return {"status": "ERROR", "message": f"User {user_id} not found."}

        # Simulated recent statement transactions
        recent_transactions = [
            {"id": "tx_901", "description": "Overdraft Protection Fee", "amount": -35.00, "date": "2026-10-14", "type": "FEE"},
            {"id": "tx_902", "description": "Grocery Store Point of Sale", "amount": -64.80, "date": "2026-10-15", "type": "PURCHASE"},
            {"id": "tx_903", "description": "Direct Deposit Payroll", "amount": 2150.00, "date": "2026-10-16", "type": "DEPOSIT"},
        ]

        return {
            "status": "SUCCESS",
            "user": user.to_dict(),
            "available_credit": round(user.credit_limit - 420.50, 2),
            "recent_transactions": recent_transactions,
        }

    @staticmethod
    async def get_recent_waiver_count(db: AsyncSession, user_id: str, days: int = 90) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        result = await db.execute(
            select(AccountAction).where(
                and_(
                    AccountAction.user_id == user_id,
                    AccountAction.action_type == "FEE_WAIVER",
                    AccountAction.status == "EXECUTED",
                    AccountAction.executed_at >= cutoff,
                )
            )
        )
        waivers = result.scalars().all()
        return len(waivers)

    @staticmethod
    async def execute_fee_waiver(
        db: AsyncSession,
        user_id: str,
        session_id: str,
        amount: float,
        reason: str = "Customer satisfaction courtesy waiver"
    ) -> Dict[str, Any]:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return {"status": "ERROR", "message": f"User {user_id} not found"}

        # Apply balance credit
        user.account_balance += amount
        action = AccountAction(
            id=f"act_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            session_id=session_id,
            action_type="FEE_WAIVER",
            requested_amount=amount,
            status="EXECUTED",
            executed_at=datetime.now(timezone.utc),
        )
        db.add(action)
        await db.commit()
        await db.refresh(user)

        return {
            "status": "SUCCESS",
            "action_id": action.id,
            "action_type": "FEE_WAIVER",
            "amount_credited": amount,
            "new_balance": round(user.account_balance, 2),
            "reason": reason,
            "timestamp": action.executed_at.isoformat(),
        }

    @staticmethod
    async def execute_credit_limit_increase(
        db: AsyncSession,
        user_id: str,
        session_id: str,
        increase_amount: float
    ) -> Dict[str, Any]:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return {"status": "ERROR", "message": f"User {user_id} not found"}

        previous_limit = user.credit_limit
        user.credit_limit += increase_amount
        action = AccountAction(
            id=f"act_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            session_id=session_id,
            action_type="CREDIT_LIMIT_INCREASE",
            requested_amount=increase_amount,
            status="EXECUTED",
            executed_at=datetime.now(timezone.utc),
        )
        db.add(action)
        await db.commit()
        await db.refresh(user)

        return {
            "status": "SUCCESS",
            "action_id": action.id,
            "action_type": "CREDIT_LIMIT_INCREASE",
            "previous_limit": previous_limit,
            "new_limit": round(user.credit_limit, 2),
            "amount_increased": increase_amount,
            "timestamp": action.executed_at.isoformat(),
        }

    @staticmethod
    async def execute_card_replacement(
        db: AsyncSession,
        user_id: str,
        session_id: str,
        card_type: str = "Contactless Visa Debit",
        shipping_speed: str = "Expedited (2-3 Business Days)"
    ) -> Dict[str, Any]:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return {"status": "ERROR", "message": f"User {user_id} not found"}

        new_card_last4 = str(uuid.uuid4().int)[:4]
        action = AccountAction(
            id=f"act_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            session_id=session_id,
            action_type="CARD_REPLACEMENT",
            requested_amount=0.0,
            status="EXECUTED",
            executed_at=datetime.now(timezone.utc),
        )
        db.add(action)
        await db.commit()

        return {
            "status": "SUCCESS",
            "action_id": action.id,
            "action_type": "CARD_REPLACEMENT",
            "previous_card_status": "FROZEN_AND_DEACTIVATED",
            "new_card_last4": new_card_last4,
            "card_type": card_type,
            "shipping_speed": shipping_speed,
            "delivery_address": "Verified primary billing address on file",
            "timestamp": action.executed_at.isoformat(),
        }

banking_tools = BankingTools()
