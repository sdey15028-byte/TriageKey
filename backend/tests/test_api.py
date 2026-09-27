import asyncio
from datetime import datetime, timezone
from sqlalchemy import delete
from fastapi.testclient import TestClient
from app.db import PublicReceipt, SessionLocal
from app.main import app



def clear_receipts():
    async def clear():
        async with SessionLocal() as session:
            await session.execute(delete(PublicReceipt))
            await session.commit()
    asyncio.run(clear())


def payload(**overrides):
    token = str(datetime.now(timezone.utc).timestamp()).replace(".", "")
    base = {"transaction_id": f"tx_{token}", "contract_address": "mn_contract_123", "disclosure_scope": "eligible", "nullifier": f"nullifier_{token}", "network": "preview", "finalized_at": datetime.now(timezone.utc).isoformat()}
    return base | overrides


def test_health():
    with TestClient(app) as client:
        assert client.get('/health').json()['status'] == 'ok'
def test_gemini_fallback_and_hash():
    with TestClient(app) as client:
        data = client.post('/proof-plan', json={"public_requirement": "Resident age 18 and qualifying pathway", "approved_labels": ["eligible"]}).json()
        assert data['plan']['provider'] == 'deterministic-local-fallback' and len(data['public_request_hash']) == 64
def test_private_policy_text_is_rejected():
    with TestClient(app) as client:
        assert client.post('/proof-plan', json={"public_requirement": "my diagnosis is private"}).status_code == 422
def test_receipt_validation_rejects_private_fields():
    with TestClient(app) as client:
        data = payload()
        data['witness'] = 'never'
        assert client.post('/receipts', json=data).status_code == 422
def test_receipt_and_metrics():
    with TestClient(app) as client:
        clear_receipts()
        assert client.post('/receipts', json=payload()).status_code == 201
        assert client.get('/metrics').json() == {"finalized_proofs": 1, "eligible_proofs": 1, "private_attributes_stored": 0}
def test_nullifier_cannot_be_reused():
    with TestClient(app) as client:
        clear_receipts()
        receipt = payload()
        client.post('/receipts', json=receipt)
        assert client.post('/receipts', json=payload(transaction_id="tx_abcdefghijk12345", nullifier=receipt['nullifier'])).status_code == 409
def test_receipt_can_be_retrieved_after_persistence():
    with TestClient(app) as client:
        clear_receipts()
        receipt = payload()
        client.post('/receipts', json=receipt)
        assert client.get(f"/receipts/{receipt['transaction_id']}").json()['nullifier'] == receipt['nullifier']
