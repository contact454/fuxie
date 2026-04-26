# Production Smoke

Use this checklist after `pnpm build` or before a deploy handoff.

## Required Gates

```bash
pnpm check
```

This runs typecheck, core tests, content QA, secret audit, and production build.

## Runtime Smoke

Before starting runtime processes, validate local env files without printing secrets:

```bash
pnpm env:audit
```

To also check whether local DB/Redis targets are reachable:

```bash
pnpm env:audit:services
```

Start the web app and AI service with the target runtime environment, then run:

```bash
pnpm smoke:production
```

The smoke checks:

- AI service health
- web DB health
- root page render
- login page render
- unauthenticated auth guards for live credentials, generate, and grade

## Environment Notes

- `DATABASE_URL` must point to a reachable Postgres database for `smoke:production`.
- `REDIS_URL` is optional for basic boot. If it is unset, BullMQ workers are disabled gracefully.
- If `REDIS_URL` is set but unreachable, AI health still returns `200` and reports queue `healthy:false`.
- Use `REDIS_URL` for BullMQ workers. Upstash REST env vars are not a BullMQ replacement.
- Never commit real `.env` files. The tracked `.env.example` must contain placeholders only.
