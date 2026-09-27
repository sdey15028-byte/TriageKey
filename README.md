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

For a real Midnight run, install the Compact compiler matching your chosen Preview/Preprod release, compile `contracts/TriageKey.compact`, commit the generated browser artifacts, set `VITE_TRIAGEKEY_CONTRACT_ADDRESS`, configure 1AM with the same network, and start a proof server:

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

Import this repository twice as two independent Vercel projects:

1. **Frontend project:** leave Root Directory at the repository root. Vercel detects Vite, runs `npm run build`, serves `dist/`, and reads the SPA rewrite from `vercel.json`. Set `VITE_API_URL` to the backend project URL.
2. **Backend project:** set Root Directory to `backend`. Vercel detects FastAPI through `app/main.py` and `[tool.vercel]` in `pyproject.toml`; no custom build command is needed. Set `DATABASE_URL`, `DATABASE_DIRECT_URL`, `GEMINI_API_KEY`, `CORS_ORIGINS`, `ENVIRONMENT=production`, and `API_DOCS_ENABLED=false`. Set `CORS_ORIGINS` to the exact frontend Vercel URL.

Before the first backend deployment, run `uv run --directory backend alembic upgrade head` locally or from a trusted CI job using the **direct, non-pooler** Neon URL. Runtime API traffic uses `DATABASE_URL`, which should be the pooled `-pooler` URL. The API automatically creates the SQLite schema only in local development; it never performs production schema changes at startup.

The proof station scrolls into public-receipt and plain-language privacy sections from its persistent rail. Public dashboard metrics are fetched from the deployed API when `VITE_API_URL` is configured; the UI deliberately shows an unavailable state rather than fabricated values. No user credential data is included in the deployed static bundle.

## CI/CD

GitHub Actions verifies Node 22, Python, frontend lint/tests/build, and backend lint/tests. Each connected Vercel project produces independent preview and production deployments; no deployment is claimed by this repository.

## Repository map

`src/` patient interface and wallet/session handling; `contracts/` Compact source; `backend/` public API and migration; `docs/` proposal, privacy model, architecture, demo; `.github/` CI/CD.

## Limitations and next steps

The repository intentionally does not pretend an unconfigured wallet, contract address, compiler, proof server, Neon project, Gemini key, or hosting target exists. Before production: compile against the selected Midnight network release, integrate generated contract bindings in `src/lib`, deploy the contract, provision Neon branches, configure the backend host, and capture real UI/test screenshots plus a real demo recording.
