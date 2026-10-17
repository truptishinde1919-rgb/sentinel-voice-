import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    phone_number = Column(String(30), nullable=False)
    account_balance = Column(Float, default=0.0, nullable=False)
    credit_limit = Column(Float, default=1000.0, nullable=False)
    risk_tier = Column(Integer, default=1, nullable=False)  # 1 = Low Risk, 2 = Medium Risk, 3 = High Risk
    facial_embedding_hash = Column(String(128), nullable=True)
    voice_print_id = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    sessions = relationship("ServicingSession", back_populates="user", cascade="all, delete-orphan")
    actions = relationship("AccountAction", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone_number": self.phone_number,
            "account_balance": round(self.account_balance, 2),
            "credit_limit": round(self.credit_limit, 2),
            "risk_tier": self.risk_tier,
            "facial_embedding_hash": self.facial_embedding_hash,
            "voice_print_id": self.voice_print_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ServicingSession(Base):
    __tablename__ = "servicing_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    channel = Column(String(50), default="WEBSOCKET_STREAM", nullable=False)
    session_status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, COMPLETED, WARM_TRANSFER, TERMINATED_FRAUD
    sentiment_score = Column(Float, default=0.75, nullable=False)
    started_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    fraud_checks = relationship("FraudCheck", back_populates="session", cascade="all, delete-orphan")
    actions = relationship("AccountAction", back_populates="session", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="session", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "channel": self.channel,
            "session_status": self.session_status,
            "sentiment_score": round(self.sentiment_score, 2),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
        }


class FraudCheck(Base):
    __tablename__ = "fraud_checks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("servicing_sessions.id"), nullable=False)
    verification_type = Column(String(60), default="FACIAL_LIVENESS_AND_MATCH", nullable=False)
    confidence_score = Column(Float, default=0.0, nullable=False)
    liveness_passed = Column(Boolean, default=False, nullable=False)
    fraud_risk_score = Column(Float, default=0.0, nullable=False)  # 0 to 100%
    decision = Column(String(50), default="PASSED", nullable=False)  # PASSED, CHALLENGE_REQUIRED, WARM_HANDOFF_ESCALATED
    performed_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    session = relationship("ServicingSession", back_populates="fraud_checks")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "verification_type": self.verification_type,
            "confidence_score": round(self.confidence_score, 2),
            "liveness_passed": self.liveness_passed,
            "fraud_risk_score": round(self.fraud_risk_score, 2),
            "decision": self.decision,
            "performed_at": self.performed_at.isoformat() if self.performed_at else None,
        }


class AccountAction(Base):
    __tablename__ = "account_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    session_id = Column(String(36), ForeignKey("servicing_sessions.id"), nullable=False)
    action_type = Column(String(60), nullable=False)  # FEE_WAIVER, CREDIT_LIMIT_INCREASE, CARD_REPLACEMENT, BALANCE_INQUIRY
    requested_amount = Column(Float, nullable=True)
    status = Column(String(50), default="EXECUTED", nullable=False)  # EXECUTED, REJECTED_BY_GUARDRAILS, PENDING_APPROVAL
    executed_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="actions")
    session = relationship("ServicingSession", back_populates="actions")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "action_type": self.action_type,
            "requested_amount": round(self.requested_amount, 2) if self.requested_amount is not None else None,
            "status": self.status,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
        }


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("servicing_sessions.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    tool_name = Column(String(80), nullable=False)
    policy_passed = Column(Boolean, default=True, nullable=False)
    policy_rules_evaluated = Column(JSON, nullable=False, default=list)
    llm_reasoning_trace = Column(Text, nullable=False)
    raw_payload = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    session = relationship("ServicingSession", back_populates="audit_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "tool_name": self.tool_name,
            "policy_passed": self.policy_passed,
            "policy_rules_evaluated": self.policy_rules_evaluated,
            "llm_reasoning_trace": self.llm_reasoning_trace,
            "raw_payload": self.raw_payload,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
