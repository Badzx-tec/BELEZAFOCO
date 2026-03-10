# Production Checklist

## Environment

- `DATABASE_URL` points to Northflank Postgres with SSL settings if required
- shared-addon deployments use a dedicated schema suffix, currently `schema=belezafoco`
- JWT secrets are unique per environment and at least 32 chars
- public URL matches the final domain
- `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_FROM` are configured before enabling self-service registration
- `GOOGLE_CLIENT_ID` is configured before exposing Google Sign-In in production
- optional Sentry, WhatsApp and Mercado Pago envs are injected through Northflank secrets

## Security

- no secrets committed in repo
- CORS origin restricted for production
- `x-workspace-id` enforced on protected routes
- rate limiting enabled
- webhook secrets configured before enabling external providers

## Database

- run `corepack pnpm prisma:migrate:deploy` in a manual/job release step
- if the addon is reused and `public` is not empty, bootstrap the app schema once with the addon admin URI before the first migration
- run seed only as controlled bootstrap data, never automatically in prod
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
- manual smoke: landing, `/auth`, `/healthz`, `/readyz` and one real public booking slug

## Smoke checks

- home page renders without console errors
- auth page renders login, register and password reset states
- dashboard renders without console errors after real login
- public booking renders only for a real tenant slug
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
