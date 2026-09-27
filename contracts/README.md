# Compact contract notes

`TriageKey.compact` defines issuer administration, policy administration and
`proveEligibility` circuits. The eligibility circuit uses private witness values for
the issuer signature, age predicate, care-pathway predicate and holder secret. Its
only result disclosure is the Boolean eligibility outcome. A holder-secret-derived
nullifier prevents replay without publishing the holder.

This repository pins the Midnight.js 4.1.1-compatible Compact compiler at `0.31.1`.
The generated browser artifacts are committed under `contracts/artifacts/`, and
`npm run contracts:verify` prevents a frontend build if any required file is absent
or looks like a placeholder. Recompile after every contract change with
`npm run contracts:compile` on Linux/macOS, or on Windows with Docker Desktop.

The frontend obtains each contract address from the wallet-approved runtime
deployment and retains only its public receipt. The address is never baked into a
frontend environment variable.
