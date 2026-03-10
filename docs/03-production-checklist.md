# Production Checklist

## Environment

- `DATABASE_URL` points to Northflank Postgres with SSL settings if required
- JWT secrets are unique per environment and at least 32 chars
- public URL matches the final domain
- optional Sentry, WhatsApp and Mercado Pago envs are injected through Northflank secrets

## Security

- no secrets committed in repo
- CORS origin restricted for production
- `x-workspace-id` enforced on protected routes
- rate limiting enabled
- webhook secrets configured before enabling external providers

## Database

- run `corepack pnpm prisma:migrate:deploy` in a manual/job release step
- run seed only in demo or staging, never automatically in prod
- verify `/readyz` after migrations
- confirm backup policy for Postgres addon

## Observability

- configure `SENTRY_DSN_API` and `VITE_SENTRY_DSN`
- set `SENTRY_ENVIRONMENT=production`
- inject release identifier on deploy
- validate one backend and one frontend captured event before go-live

## Backups and restore

- verify Northflank Postgres backup cadence
- keep a manual SQL export runbook
- test restore in non-production before accepting the backup strategy

## Tests

- `corepack pnpm test`
- `corepack pnpm test:e2e`
- manual smoke: landing, dashboard, `/b/demo-beleza`, `/healthz`, `/readyz`

## Smoke checks

- home page renders without console errors
- dashboard renders without console errors
- public booking demo completes Pix-style reservation
- API health returns `200`
- readiness returns `200` after migrations

## Minimum performance targets

- landing remains below ~250 KB gzipped JS bundle
- public booking first render has no blocking console errors
- dashboard navigation remains responsive on mobile viewport

## Rollback

- rollback image tag in Northflank if app health degrades
- never rollback code without also reviewing migration compatibility
- use backward-compatible migrations when possible

## Readiness gate

- image built successfully
- migrations applied
- `/healthz` healthy
- `/readyz` healthy
- one E2E smoke pass completed
