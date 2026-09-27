# Compact contract notes

`TriageKey.compact` describes two circuits: `prove_eligibility` and `set_policy`.
The proof circuit uses private witness values for the issuer signature, age predicate,
care-pathway predicate and holder secret. Its only `disclose()` is the Boolean
eligibility result. The nullifier derives from the private holder secret plus a
public nonce and policy hash, preventing replay without publishing the holder.

This repository pins the Midnight.js 4.1.1-compatible Compact compiler at `0.31.1`.
Run `npm run contracts:compile` on Linux/macOS, or on Windows with Docker Desktop
running, and commit the generated browser artifacts under `contracts/artifacts/`.
The frontend should obtain the contract address from the
wallet-approved runtime deployment flow and retain it in the active session/public
receipt; it must not be baked into the frontend environment.
