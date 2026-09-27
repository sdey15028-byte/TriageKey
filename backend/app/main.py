from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from .db import PublicReceipt, get_session, init_database, receipt_metrics
from .gemini import compose_proof_plan
from .schemas import Metrics, PlanRequest, ReceiptIn
from .settings import settings

@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_database()
    yield


app = FastAPI(title="TriageKey public API", version="1.0.0", docs_url="/docs" if settings.api_docs_enabled else None, redoc_url=None, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()], allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type", "Authorization"], max_age=600)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "privacy": "private data is not accepted", "version": app.version}

@app.get("/metrics", response_model=Metrics)
async def metrics(session: AsyncSession = Depends(get_session)) -> Metrics:
    finalized, eligible = await receipt_metrics(session)
    return Metrics(finalized_proofs=finalized, eligible_proofs=eligible)

@app.post("/proof-plan")
async def proof_plan(payload: PlanRequest):
    plan, request_hash = await compose_proof_plan(payload)
    return {"plan": plan, "public_request_hash": request_hash}

@app.post("/receipts", response_model=ReceiptIn, status_code=201)
async def create_receipt(receipt: ReceiptIn, session: AsyncSession = Depends(get_session)) -> ReceiptIn:
    existing = await session.scalar(select(PublicReceipt.transaction_id).where(PublicReceipt.nullifier == receipt.nullifier))
    if existing:
        raise HTTPException(status_code=409, detail="This proof nullifier was already used")
    record = PublicReceipt(**receipt.model_dump())
    session.add(record)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=409, detail="This proof receipt already exists") from error
    return receipt

@app.get("/receipts/{transaction_id}", response_model=ReceiptIn)
async def get_receipt(transaction_id: str, session: AsyncSession = Depends(get_session)) -> ReceiptIn:
    record = await session.get(PublicReceipt, transaction_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Public receipt not found")
    return ReceiptIn.model_validate(record, from_attributes=True)
