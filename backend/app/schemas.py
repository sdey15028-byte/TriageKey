from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

PRIVATE_FIELDS = {"witness", "secret", "seed_phrase", "private_state", "credential", "diagnosis", "birth_date", "wallet_address", "document"}


class PlanRequest(BaseModel):
    public_requirement: str = Field(min_length=8, max_length=800)
    approved_labels: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("public_requirement")
    @classmethod
    def only_public_text(cls, value: str) -> str:
        lowered = value.lower()
        if any(word in lowered for word in PRIVATE_FIELDS):
            raise ValueError("Private fields are not allowed in public policy text")
        return value


class ProofPlan(BaseModel):
    public_claim: str
    private_checks: list[str]
    disclosure_explanation: str
    provider: str


class ReceiptIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    transaction_id: str = Field(min_length=16, max_length=128)
    contract_address: str = Field(min_length=8, max_length=128)
    disclosure_scope: str = Field(pattern=r"^(eligible|ineligible)$")
    nullifier: str = Field(min_length=16, max_length=128)
    network: str = Field(pattern=r"^(preview|preprod)$")
    finalized_at: datetime

    @field_validator("transaction_id", "contract_address", "nullifier")
    @classmethod
    def identifiers_are_public_safe(cls, value: str) -> str:
        if any(marker in value.lower() for marker in PRIVATE_FIELDS):
            raise ValueError("Public receipt identifiers cannot contain private fields")
        return value.strip()


class Metrics(BaseModel):
    finalized_proofs: int
    eligible_proofs: int
    private_attributes_stored: int = 0
