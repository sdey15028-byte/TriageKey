# Architecture

```text
Patient browser ── local credential / witness ──> Midnight wallet + proof server
      │                                               │
      ├── public policy only ──> FastAPI ──> Gemini (optional, bounded)
      │                                               │
      └── finalized public receipt ───────────> Neon Postgres
```

The Vite application discovers UUID-keyed `window.midnight` providers, lists 1AM first, and resets its session on a network change. It never manufactures a receipt: without a connected wallet and real finalization, the UI remains in a clear non-final state.

FastAPI uses async-capable SQLAlchemy dependencies and supports SQLite locally. Use a pooled Neon connection for API traffic and `DATABASE_DIRECT_URL` for Alembic migration commands. Production receipt storage must use the migration in `backend/alembic/`.
