# TriageKey — private care-program eligibility

## Three explored concepts

| Concept | Pitch | Privacy value | Public result |
|---|---|---|---|
| **TriageKey** (selected) | A patient proves eligibility for a support program without releasing their medical record. | Age predicate, care-pathway predicate, issuer signature, holder secret. | Eligible/ineligible, policy ID, nullifier. |
| ShiftLine | A worker privately proves that their mandated rest period is satisfied before accepting an industrial shift. | Shift history and medical accommodation. | Safe to schedule/not safe to schedule. |
| CivicRelay | A resident privately proves they belong to a disaster-response zone before accessing relief supplies. | Home location and credential. | Entitled/not entitled plus one-time claim marker. |

## Why TriageKey won

It makes selective disclosure directly useful to patients and care administrators: the clinic needs one decision, not a lifetime of sensitive context. It is visually distinctive as a calm care terminal, explainable in one minute, and MVP-realistic because the credential adapter can begin with a signed local issuer credential.

Gemini’s bounded role is explaining the **public** policy in patient-friendly language and producing a public proof plan. It never receives a witness, record, secret, wallet address, diagnosis, exact age, or document.
