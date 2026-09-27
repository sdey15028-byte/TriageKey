import hashlib
from .privacy import redact_public_text
from .schemas import PlanRequest, ProofPlan
from .settings import settings


def fallback_plan(request: PlanRequest) -> ProofPlan:
    return ProofPlan(public_claim="Eligibility decision: eligible or ineligible", private_checks=["Validate local issuer signature", "Evaluate the public program rule locally"], disclosure_explanation="Only the eligibility outcome and a one-time nullifier are public.", provider="deterministic-local-fallback")


async def compose_proof_plan(request: PlanRequest) -> tuple[ProofPlan, str]:
    sanitized = redact_public_text(request.public_requirement)
    request_hash = hashlib.sha256(sanitized.encode()).hexdigest()
    if not settings.gemini_api_key:
        return fallback_plan(request), request_hash
    # Only public policy language and approved labels are eligible for this prompt.
    from google import genai
    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = f"Return a short privacy-safe verifier plan for this public policy: {sanitized}. Labels: {request.approved_labels}. Never ask for identities, health data, wallet addresses, secrets, or documents."
    try:
        response = await client.aio.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        text = response.text or ""
        return ProofPlan(public_claim="Eligibility decision: eligible or ineligible", private_checks=["Evaluate policy locally"], disclosure_explanation=text[:500] or fallback_plan(request).disclosure_explanation, provider="gemini"), request_hash
    except Exception:
        return fallback_plan(request), request_hash
