from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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
    transaction_hash: str = Field(pattern=r"^(0x)?[0-9a-fA-F]{64}$")
    contract_address: str = Field(pattern=r"^(0x)?[0-9a-fA-F]{64}$")
    receipt_type: Literal["deployment", "proof"]
    disclosure_scope: Literal["eligible", "ineligible"] | None = None
    nullifier: str | None = Field(default=None, min_length=16, max_length=128)
    network: str = Field(pattern=r"^(preview|preprod)$")
    block_height: int | None = Field(default=None, ge=0)
    finalized_at: datetime

    @field_validator("transaction_id", "transaction_hash", "contract_address", "nullifier")
    @classmethod
    def identifiers_are_public_safe(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if any(marker in value.lower() for marker in PRIVATE_FIELDS):
            raise ValueError("Public receipt identifiers cannot contain private fields")
        return value.strip()

    @model_validator(mode="after")
    def receipt_fields_match_type(self):
        if self.receipt_type == "proof" and (self.disclosure_scope is None or self.nullifier is None):
            raise ValueError("Proof receipts require a disclosure outcome and nullifier")
        if self.receipt_type == "deployment" and (self.disclosure_scope is not None or self.nullifier is not None):
            raise ValueError("Deployment receipts cannot contain proof disclosure fields")
        return self


class Metrics(BaseModel):
    finalized_proofs: int
    eligible_proofs: int
    private_attributes_stored: int = 0
