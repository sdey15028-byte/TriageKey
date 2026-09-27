# Privacy model

## Boundary

The holder’s device evaluates issuer verification, age threshold, care-pathway predicate and holder-secret-derived nullifier within the Midnight proof. The verifier receives a Boolean outcome; the API accepts only public receipts after a real transaction is finalized.

| Observer can learn | Observer cannot learn |
|---|---|
| Program policy hash | Date of birth or exact age |
| Eligible/ineligible outcome | Diagnosis or care pathway details |
| One-time nullifier | Holder identity or wallet address |
| Finalized transaction ID | Credential, document, issuer signature, secret |
| Aggregate counts | Raw private inputs or witness values |

`disclose(true)` is intentionally limited to the outcome. The contract’s nullifier prevents replay, but is derived from a holder secret that is never disclosed.

## Data retention

The frontend keeps the credential adapter state in browser local storage. The backend stores only public receipt metadata and a hash of sanitized public policy text. Input schemas reject known private-field names; Gemini requests are redacted before dispatch.
