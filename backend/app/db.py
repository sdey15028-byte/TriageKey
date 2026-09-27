"""Async database lifecycle and public-receipt persistence.

The runtime uses DATABASE_URL (the pooled Neon URL in production). Alembic must
use DATABASE_DIRECT_URL, which is intentionally not consumed by this module.
"""
from collections.abc import AsyncIterator
from datetime import datetime
from sqlalchemy import DateTime, String, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from .settings import settings


class Base(DeclarativeBase):
    pass


class PublicReceipt(Base):
    __tablename__ = "public_receipts"

    transaction_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    transaction_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    contract_address: Mapped[str] = mapped_column(String(128), nullable=False)
    receipt_type: Mapped[str] = mapped_column(String(20), nullable=False)
    disclosure_scope: Mapped[str | None] = mapped_column(String(20), nullable=True)
    nullifier: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True, index=True)
    network: Mapped[str] = mapped_column(String(20), nullable=False)
    block_height: Mapped[int | None] = mapped_column(nullable=True)
    finalized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def init_database() -> None:
    """SQLite initializes locally; production schemas are Alembic-managed."""
    if settings.database_url.startswith("sqlite"):
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def receipt_metrics(session: AsyncSession) -> tuple[int, int]:
    total = await session.scalar(
        select(func.count()).select_from(PublicReceipt).where(PublicReceipt.receipt_type == "proof")
    )
    eligible = await session.scalar(
        select(func.count()).select_from(PublicReceipt).where(
            PublicReceipt.receipt_type == "proof", PublicReceipt.disclosure_scope == "eligible"
        )
    )
    return int(total or 0), int(eligible or 0)
