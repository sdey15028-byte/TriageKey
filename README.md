# TriageKey

> Privacy-preserving eligibility for care programs. A patient proves a public rule without exposing their medical record.

![CI](https://github.com/sdey15028-byte/TriageKey/actions/workflows/ci.yml/badge.svg)

## Product and privacy

TriageKey is built for patients who need access to support programs but should not have to hand over unrelated personal health information. Midnight is essential because the verifier needs only a Boolean outcome while proof constraints evaluate private credential claims. See [the product proposal](docs/PRODUCT_PROPOSAL.md) and [privacy model](docs/PRIVACY_MODEL.md).

The visual system is neo-industrial care terminal: warm bone surfaces, dark instrument rails, steel borders, safety-orange actions, and plain-language, patient-first guidance. It avoids generic crypto styling.

## Stack

- React, TypeScript, Vite, Framer Motion
- Midnight.js `4.1.1` and DApp Connector API `4.0.1`
- 1AM-compatible UUID-keyed wallet discovery
- FastAPI, async SQLAlchemy, Alembic, Pydantic
- Neon Postgres (pooled traffic URL; direct migration URL)
- Google GenAI SDK with a deterministic privacy-safe fallback

## Local setup

```bash
npm install
npm run dev
uv sync --directory backend --all-groups
uv run --directory backend uvicorn app.main:app --reload
```

Copy `.env.example` to `backend/.env`. Keep `GEMINI_API_KEY` server-side. Use a Neon development branch for `DATABASE_URL`; reserve `DATABASE_DIRECT_URL` for `uv run --directory backend alembic upgrade head`.

The Compact contract and all four circuits are compiled with toolchain `0.31.1`; the generated bindings, ZK IR, prover keys and verifier keys are committed under `contracts/artifacts/`. Configure 1AM for the selected network and start a compatible proof server. The application obtains every deployed contract address at runtime from the wallet-approved deployment flow; it is not a frontend environment variable:

```bash
docker compose -f docker-compose.proof.yml up
```

## Commands

```bash
npm run lint && npm run test && npm run build
uv run --directory backend ruff check .
uv run --directory backend pytest
```

## Vercel deployment

Import this repository once and select **Services** as the Vercel project framework. The root `vercel.json` builds the Vite frontend and FastAPI backend as independent services in one deployment, routes `/api/*` to FastAPI, and routes all other paths to Vite. No frontend API URL is required in Vercel because production requests use the same-origin `/api` default.

Add `DATABASE_URL`, `CORS_ORIGINS`, `ENVIRONMENT=production`, and `API_DOCS_ENABLED=false` in the Vercel project; `GEMINI_API_KEY` is optional. Set `CORS_ORIGINS` to the exact production domain. Keep `DATABASE_DIRECT_URL` only in the trusted local/CI environment that runs Alembic rather than exposing it to the runtime service. Do not add a contract-address environment variable—the finalized address is produced by the wallet-approved Midnight deployment.

Before the first backend deployment, run `uv run --directory backend alembic upgrade head` locally or from a trusted CI job using the **direct, non-pooler** Neon URL. Runtime API traffic uses `DATABASE_URL`, which should be the pooled `-pooler` URL. The API automatically creates the SQLite schema only in local development; it never performs production schema changes at startup.

The proof station scrolls into public-receipt and plain-language privacy sections from its persistent rail. Public dashboard metrics use same-origin `/api` on Vercel and the `VITE_API_URL` override locally. After a real Midnight finalization, the site displays and retains the deployed contract address, transaction hash, transaction ID, network, block and timestamp with copy and explorer controls. It deliberately shows an unavailable state rather than fabricated values. No user credential data is included in the deployed static bundle.
## Live Website Url

https://triage-key.vercel.app/

## Demo Video URL

https://drive.google.com/file/d/1-Tk4z8I1Qm2pkHDNKZVRVW_Ja9j-RAGf/view?usp=sharing

## Website Screenshots

<img width="1400" height="700" alt="Screenshot 2026-09-29 014400" src="https://github.com/user-attachments/assets/6511d32d-99c3-48a6-b880-639ee6c7826c" />
<img width="1400" height="700" alt="Screenshot 2026-09-29 014345" src="https://github.com/user-attachments/assets/2ac2b25c-3b91-493d-ad57-39352e42452d" />
<img width="1400" height="700" alt="Screenshot 2026-09-29 014248" src="https://github.com/user-attachments/assets/866857a2-730a-45bc-9895-c8a9ae9cc445" />
## Mobile Responsive UI

<img width="300" height="700" alt="Screenshot_2026-09-29-01-46-24-899_com android chrome" src="https://github.com/user-attachments/assets/a921f5a1-f8b2-427f-a514-bcd9e7f911bf" />
<img width="300" height="700" alt="Screenshot_2026-09-29-01-46-28-034_com android chrome" src="https://github.com/user-attachments/assets/cd6ef05d-c5ab-443c-b5da-4c7b59fc4084" />

## CI CD Pipeline
<img width="1917" height="785" alt="image" src="https://github.com/user-attachments/assets/264e47b3-b540-45fc-b0b7-7d3095e9a01e" />

## Reference deployments

These finalized public identifiers are provided for verifying the deployed TriageKey contracts. They are documentation references only; the application still obtains each new deployment address and transaction hash directly from the wallet-approved Midnight transaction.

| Network | Contract address | Transaction hash |
| --- | --- | --- |
| Preview | `dce266d277c925ad315630d4f5f93e69b86d9bd5e702152e2e20eac6e379ff9d` | [`ab44c92ad5e27f9be3813526ce98396485e34be348dcfd0302d5e05d33cd2191`](https://preview.midnightexplorer.com/transactions/ab44c92ad5e27f9be3813526ce98396485e34be348dcfd0302d5e05d33cd2191) |
| Preprod | `1e909a0c0028f540b1f91cc097abd8c99e9ff1152cac29b923ece8102f3a9752` | [`bb0169346414bdd6ab28f84e659f9fc7bbac322d93d33337feb96b3684ebbccf`](https://preprod.midnightexplorer.com/transactions/bb0169346414bdd6ab28f84e659f9fc7bbac322d93d33337feb96b3684ebbccf) |

## CI/CD

GitHub Actions verifies Node 22, Python, frontend lint/tests/build, and backend lint/tests. Each Vercel deployment builds both services together; no deployment is claimed by this repository.

## Repository map

`src/` patient interface and wallet/session handling; `contracts/` Compact source; `backend/` public API and migration; `docs/` proposal, privacy model, architecture, demo; `.github/` CI/CD.

## Limitations and next steps

The compiled contract and real Midnight deployment adapter are wired into the frontend. A real transaction still requires a connected 1AM wallet on the selected network, sufficient DUST, a compatible proof server and reachable indexer. The eligibility circuit additionally requires a trusted issuer to be registered and a valid signed attestation to be enrolled; the current UI performs contract deployment and shows its finalized identifiers, but does not fabricate an eligibility proof. Before production, provision Neon, run the migration, configure the Vercel Services project, and capture a real wallet-backed demo.
