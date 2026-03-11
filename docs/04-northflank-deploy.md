# Northflank Deploy

## Goal

Publish BELEZAFOCO as a stable combined service on Northflank with predictable migrations, explicit secrets, job-based operations and safe rollback steps.

## Topology

- one Docker-based combined service for Fastify + compiled SPA
- separate jobs for migrations and optional recurring workers
- PostgreSQL as the primary addon
- Redis only if reminder/reconciliation scale requires external coordination

## Required variables

### Core runtime

- `NODE_ENV=production`
- `PORT=3333`
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `API_BASE_URL`
- `PUBLIC_URL`
- `APP_URL`

### Auth and messaging

- `GOOGLE_CLIENT_ID`
- `GOOGLE_ALLOWED_ORIGINS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `WHATSAPP_PROVIDER`
- `WHATSAPP_CLOUD_API_TOKEN`
- `WHATSAPP_CLOUD_PHONE_ID`
- `WHATSAPP_CLOUD_API_VERSION`
- `WHATSAPP_CLOUD_API_VERIFY_TOKEN`
- `WHATSAPP_CLOUD_API_APP_SECRET`

### Payments and observability

- `MERCADO_PAGO_ENABLED`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `SENTRY_DSN_API`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT`
- `VITE_SENTRY_RELEASE`
- `VITE_API_URL`

## Release strategy

1. Build the root `Dockerfile` as the combined service image.
2. Keep `RUN_MIGRATIONS_ON_START=false` on the main service.
3. Run a dedicated migrations job with `corepack pnpm --filter @belezafoco/api prisma:migrate:deploy`.
4. Optionally run a demo seed job with `corepack pnpm seed`.
5. Promote traffic only after health checks and auth smoke tests pass.

## Health checks

- liveness: `GET /healthz`
- readiness: `GET /readyz`
- auth smoke: `GET /auth/config`
- commercial smoke: `GET /b/demo-beleza` on every release, unless `PUBLIC_DEMO_ENABLED=false` is set explicitly

## Google Sign-In checklist

Before promoting a new Northflank domain:

1. Add the published frontend origin to **Authorized JavaScript origins** in Google Cloud Console.
2. Keep `GOOGLE_ALLOWED_ORIGINS` aligned with every active preview/production domain.
3. Current Google client id already provided for BELEZAFOCO:
   - `651033320243-a6dset1ujeotn51g0i7ncv800v627ecf.apps.googleusercontent.com`
4. Current minimum origin list to authorize both in Northflank env and in Google Cloud Console:
   - `http://localhost:5173`
   - `https://p03--belezafoco-api--fdzfclqyqq99.code.run`
5. As soon as the Northflank public URL exists, append it to `GOOGLE_ALLOWED_ORIGINS` and add the same URL under `Authorized JavaScript origins`.
3. Keep `PUBLIC_URL`, `APP_URL` and `VITE_API_URL` aligned with the same published surface.
4. Validate `/auth/config` on the deployed domain and confirm `googleEnabled=true`.
5. Open `/auth` in a browser and confirm there is no `GSI_LOGGER` origin error.

## Runtime notes

- base image: `node:20-bookworm-slim`
- `docker/start.sh` can run migrations only when explicitly enabled
- `apps/api/src/config/env.ts` now resolves `.env` from both package and workspace-root locations, which stabilizes monorepo execution and local reproduction

## Rollback

1. revert the service to the last healthy image
2. do not rerun seed during rollback
3. confirm `/healthz`, `/readyz` and `/auth/config`
4. review Sentry events and webhook logs after rollback

## Current blocker to live redeploy

The code is prepared for the Google origin gate, but the live platform update still requires Northflank access plus Google Cloud Console changes. Without that external access, the repository can only prepare the release path, not complete the live promotion itself.
