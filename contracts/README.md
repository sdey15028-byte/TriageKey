# Compact contract notes

`TriageKey.compact` describes two circuits: `prove_eligibility` and `set_policy`.
The proof circuit uses private witness values for the issuer signature, age predicate,
care-pathway predicate and holder secret. Its only `disclose()` is the Boolean
eligibility result. The nullifier derives from the private holder secret plus a
public nonce and policy hash, preventing replay without publishing the holder.

Compile it with the Compact compiler version specified by your target Preview or
Preprod release, commit the generated browser artifacts under `contracts/artifacts/`,
and supply their contract address through `VITE_TRIAGEKEY_CONTRACT_ADDRESS`.
