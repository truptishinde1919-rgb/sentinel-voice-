import os
from typing import List, Any
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SentinelVoice"
    ENV: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./sentinel_voice.db"
    
    # Biometric & Fraud Detection Guardrail Thresholds
    FRAUD_RISK_THRESHOLD: float = 15.0  # If risk > 15%, require secondary verification / warm handoff
    MIN_BIOMETRIC_CONFIDENCE: float = 85.0  # Minimum face match confidence required for sensitive operations
    MIN_LIVENESS_SCORE: float = 75.0  # Minimum liveness confidence
    
    # Financial Action Guardrails (Deterministic Policy Engine)
    MAX_WAIVER_AMOUNT: float = 50.0  # Max $50 waiver per request
    MAX_WAIVER_DAYS_INTERVAL: int = 90  # Max 1 waiver per 90 days
    MAX_CREDIT_LIMIT_INCREASE_PCT: float = 25.0  # Max 25% credit limit increase without underwriter
    MAX_ALLOWED_RISK_TIER_FOR_ACTIONS: int = 2  # Tier 1 & 2 allowed, Tier 3 blocked
    
    # AI & API Configuration
    OPENAI_API_KEY: str = ""
    WHISPER_API_KEY: str = ""
    MODEL_NAME: str = "gpt-4o"
    
    # CORS (Allows vercel.app, localhost, and custom domains)
    CORS_ORIGINS: Any = ["https://*.vercel.app", "http://localhost:3000", "http://127.0.0.1:3000", "*"]

    def get_cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        return ["*"]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
