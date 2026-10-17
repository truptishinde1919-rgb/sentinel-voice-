import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from config import settings
from database.models import Base, User

# Support both SQLite async and PostgreSQL async
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    database_url,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in database_url else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Check if default demo users exist, if not seed them
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        if not users:
            seed_users = [
                User(
                    id="usr_elena_rostova",
                    full_name="Elena Rostova",
                    email="elena.rostova@nexusbank.com",
                    phone_number="+1 (555) 382-9011",
                    account_balance=4850.50,
                    credit_limit=12500.00,
                    risk_tier=1,
                    facial_embedding_hash="sha256_elena_verified_bio_7781a",
                    voice_print_id="vp_elena_001",
                ),
                User(
                    id="usr_marcus_vance",
                    full_name="Marcus Vance",
                    email="m.vance@nexusbank.com",
                    phone_number="+1 (555) 749-3320",
                    account_balance=340.00,
                    credit_limit=1000.00,
                    risk_tier=3,
                    facial_embedding_hash="sha256_marcus_baseline_9912b",
                    voice_print_id="vp_marcus_002",
                ),
                User(
                    id="usr_sophia_chen",
                    full_name="Sophia Chen",
                    email="sophia.chen@nexusbank.com",
                    phone_number="+1 (555) 612-4489",
                    account_balance=1280.00,
                    credit_limit=3000.00,
                    risk_tier=2,
                    facial_embedding_hash="sha256_sophia_baseline_4410c",
                    voice_print_id="vp_sophia_003",
                ),
            ]
            session.add_all(seed_users)
            await session.commit()
            print("Database initialized and seeded with demo accounts successfully.")
