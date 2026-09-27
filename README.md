# TriageKey

> Privacy-preserving eligibility for care programs. A patient proves a public rule without exposing their medical record.

![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)

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

For a real Midnight run, compile `contracts/TriageKey.compact` with the pinned `0.31.1` toolchain (`npm run contracts:compile`; Docker Desktop is required on Windows), commit the generated browser artifacts, configure 1AM with the same network, and start a proof server. The application must obtain the deployed contract address at runtime from the wallet-approved deployment flow; it is not a frontend environment variable:

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

## CI/CD

GitHub Actions verifies Node 22, Python, frontend lint/tests/build, and backend lint/tests. Each Vercel deployment builds both services together; no deployment is claimed by this repository.

## Repository map

`src/` patient interface and wallet/session handling; `contracts/` Compact source; `backend/` public API and migration; `docs/` proposal, privacy model, architecture, demo; `.github/` CI/CD.

## Limitations and next steps

The repository intentionally does not pretend an unconfigured wallet, compiler, proof server, Neon project, Gemini key, or hosting target exists. The receipt pipeline and deployment-adapter boundary are implemented, but a real transaction still requires compiling `contracts/TriageKey.compact` against the selected Midnight network release and registering those generated bindings with `registerDeploymentAdapter`. Before production, also provision Neon, run the migration, configure the Vercel Services project, and capture a real wallet-backed demo.
