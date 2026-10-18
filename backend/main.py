import asyncio
import json
import uuid
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database.db_session import init_db, get_db, AsyncSessionLocal
from database.models import User, ServicingSession, FraudCheck, AccountAction, AuditLog
from security.biometrics import biometric_engine
from security.pii_scrubber import pii_scrubber
from agents.servicing_agent import servicing_agent
from tools.banking_tools import banking_tools

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.PROJECT_NAME} backend engine...")
    await init_db()
    yield
    print("Shutting down SentinelVoice...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multimodal AI Customer Servicing Platform with Real-Time Fraud Verification & Autonomous Action Execution",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supervisor WebSocket Connection Manager
class SupervisorConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

supervisor_manager = SupervisorConnectionManager()

# --- Schemas ---
class ChatTurnRequest(BaseModel):
    session_id: str
    user_id: str
    message: str
    biometric_telemetry: Optional[Dict[str, Any]] = None

class FrameAnalysisRequest(BaseModel):
    frame_base64: Optional[str] = None
    user_risk_tier: int = 1
    requested_action: Optional[str] = None
    requested_amount: Optional[float] = None
    audio_telemetry: Optional[Dict[str, Any]] = None

class ActionOverrideRequest(BaseModel):
    session_id: str
    action_id: str
    approved: bool
    supervisor_notes: str

# --- REST Endpoints ---
@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "documentation": "/docs",
        "health_check": "/health",
        "api_endpoints": {
            "users": "/api/users",
            "active_sessions": "/api/sessions/active",
            "audit_logs": "/api/audit-logs",
            "fraud_checks": "/api/fraud-checks",
            "websocket_voice": "/ws/voice",
            "websocket_servicing": "/ws/servicing/{session_id}"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/api/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [u.to_dict() for u in users]

@app.get("/api/users/{user_id}")
async def get_user_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    details = await banking_tools.get_account_details(db, user_id)
    if details.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail="User not found")
    return details

@app.get("/api/sessions/active")
async def get_active_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ServicingSession).order_by(desc(ServicingSession.started_at)).limit(20)
    )
    sessions = result.scalars().all()
    session_list = []
    for s in sessions:
        user_res = await db.execute(select(User).where(User.id == s.user_id))
        user = user_res.scalar_one_or_none()
        s_dict = s.to_dict()
        s_dict["user_name"] = user.full_name if user else "Unknown User"
        s_dict["user_risk_tier"] = user.risk_tier if user else 1
        session_list.append(s_dict)
    return session_list

@app.get("/api/audit-logs")
async def get_audit_logs(
    session_id: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit)
    if session_id:
        query = query.where(AuditLog.session_id == session_id)
    result = await db.execute(query)
    logs = result.scalars().all()
    return [l.to_dict() for l in logs]

@app.get("/api/fraud-checks")
async def get_fraud_checks(
    session_id: Optional[str] = None,
    limit: int = Query(default=30, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(FraudCheck).order_by(desc(FraudCheck.performed_at)).limit(limit)
    if session_id:
        query = query.where(FraudCheck.session_id == session_id)
    result = await db.execute(query)
    checks = result.scalars().all()
    return [c.to_dict() for c in checks]

@app.post("/api/biometrics/analyze-frame")
async def analyze_biometric_frame(req: FrameAnalysisRequest):
    result = biometric_engine.verify_frame(
        frame_base64=req.frame_base64,
        audio_telemetry=req.audio_telemetry,
        user_risk_tier=req.user_risk_tier,
        requested_action=req.requested_action,
        requested_amount=req.requested_amount,
    )
    return result

@app.post("/api/chat/turn")
async def process_chat_turn(req: ChatTurnRequest, db: AsyncSession = Depends(get_db)):
    result = await servicing_agent.run_turn(
        db=db,
        session_id=req.session_id,
        user_id=req.user_id,
        user_message=req.message,
        biometric_telemetry=req.biometric_telemetry,
    )
    # Broadcast to supervisor dashboard
    await supervisor_manager.broadcast({
        "event_type": "SESSION_TURN_COMPLETED",
        "session_id": req.session_id,
        "user_id": req.user_id,
        "user_message": req.message,
        "agent_reply": result["reply"],
        "fraud_risk_score": result["fraud_risk_score"],
        "action_executed": result["action_executed"],
        "warm_handoff": result["warm_handoff"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return result

@app.post("/api/sessions/{session_id}/transfer")
async def trigger_warm_transfer(session_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ServicingSession).where(ServicingSession.id == session_id))
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.session_status = "WARM_TRANSFER_TRIGGERED"
    await db.commit()
    await supervisor_manager.broadcast({
        "event_type": "WARM_TRANSFER_REQUESTED",
        "session_id": session_id,
        "user_id": session.user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "SUCCESS", "message": f"Session {session_id} transferred to supervisor pool."}

@app.post("/api/actions/override")
async def supervisor_action_override(req: ActionOverrideRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AccountAction).where(AccountAction.id == req.action_id))
    action = res.scalar_one_or_none()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    action.status = "EXECUTED_BY_SUPERVISOR_OVERRIDE" if req.approved else "REJECTED_BY_SUPERVISOR"
    await db.commit()
    return {"status": "SUCCESS", "action_id": req.action_id, "new_status": action.status}

# --- WebSocket Streaming Protocols ---
@app.websocket("/ws/servicing/{session_id}")
async def servicing_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    current_user_id = "usr_elena_rostova"

    # Send initial handshake
    await websocket.send_json({
        "type": "CONNECTION_ESTABLISHED",
        "session_id": session_id,
        "system_status": "ONLINE",
        "speech_latency_ms": 320,
        "message": "SentinelVoice biometric streaming channel active.",
    })

    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            msg_type = data.get("type")

            if msg_type == "FRAME_TELEMETRY":
                user_id = data.get("user_id", current_user_id)
                current_user_id = user_id
                user_tier = data.get("user_risk_tier", 1)
                frame_data = data.get("frame_base64")
                audio_meta = data.get("audio_telemetry")

                # Compute biometric analytics
                bio_result = biometric_engine.verify_frame(
                    frame_base64=frame_data,
                    audio_telemetry=audio_meta,
                    user_risk_tier=user_tier,
                    requested_action=data.get("action_context"),
                )

                await websocket.send_json({
                    "type": "BIOMETRIC_UPDATE",
                    "telemetry": bio_result,
                })

            elif msg_type == "AUDIO_TRANSCRIPT":
                text = data.get("text", "")
                user_id = data.get("user_id", current_user_id)
                bio_telemetry = data.get("biometric_telemetry")

                async with AsyncSessionLocal() as db:
                    result = await servicing_agent.run_turn(
                        db=db,
                        session_id=session_id,
                        user_id=user_id,
                        user_message=text,
                        biometric_telemetry=bio_telemetry,
                    )

                # Send agent response back to client with speech synthesizer text
                await websocket.send_json({
                    "type": "AGENT_RESPONSE",
                    "reply": result["reply"],
                    "action_executed": result["action_executed"],
                    "guardrail_result": result["guardrail_result"],
                    "fraud_risk_score": result["fraud_risk_score"],
                    "biometric_telemetry": result["biometric_telemetry"],
                    "warm_handoff": result["warm_handoff"],
                    "audit_trace": result["audit_trace"],
                    "updated_user": result["user"],
                })

                # Broadcast to supervisor dashboard
                await supervisor_manager.broadcast({
                    "event_type": "LIVE_SESSION_TELEMETRY",
                    "session_id": session_id,
                    "user_id": user_id,
                    "user_message": text,
                    "agent_reply": result["reply"],
                    "fraud_risk_score": result["fraud_risk_score"],
                    "action_executed": result["action_executed"],
                    "warm_handoff": result["warm_handoff"],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

            elif msg_type == "PING":
                await websocket.send_json({"type": "PONG", "timestamp": datetime.now(timezone.utc).isoformat()})

    except WebSocketDisconnect:
        print(f"Client disconnected from session {session_id}")
    except Exception as e:
        print(f"WebSocket error in session {session_id}: {e}")

@app.websocket("/ws/voice")
async def voice_websocket_alias(websocket: WebSocket):
    await servicing_websocket(websocket, session_id="voice_stream_default")

@app.websocket("/ws/supervisor")
async def supervisor_websocket(websocket: WebSocket):
    await supervisor_manager.connect(websocket)
    try:
        while True:
            # Keep connection open for push notifications
            await websocket.receive_text()
    except WebSocketDisconnect:
        supervisor_manager.disconnect(websocket)
