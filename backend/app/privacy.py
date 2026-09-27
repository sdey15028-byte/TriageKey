import re
from .schemas import PRIVATE_FIELDS

SENSITIVE_PATTERNS = [r"\b\d{3}-\d{2}-\d{4}\b", r"\b(?:\d[ -]?){13,16}\b", r"\bmn1[a-z0-9]+\b"]


def redact_public_text(value: str) -> str:
    for pattern in SENSITIVE_PATTERNS:
        value = re.sub(pattern, "[REDACTED]", value, flags=re.IGNORECASE)
    for field in PRIVATE_FIELDS:
        value = re.sub(rf"\b{re.escape(field)}\b", "[REDACTED FIELD]", value, flags=re.IGNORECASE)
    return value
