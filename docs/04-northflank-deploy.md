# Northflank Deploy Guide

## Target shape

- one combined service built from the root `Dockerfile`
- one Postgres addon
- one manual migration job
- one optional demo seed job

## Service setup

1. Create a combined service from Git.
2. Point build to the repo root.
3. Use the checked-in `Dockerfile`.
4. Expose port `3333`.
5. Configure health check path `/healthz`.
6. Configure readiness path `/readyz`.

## Why this image works

- Debian slim runtime for Prisma stability
- multi-stage build
- `prisma generate` executed during image build
- built frontend is served by Fastify in the same service
- same-origin API requests work without extra reverse proxy rules

## Postgres addon

1. Create a PostgreSQL addon in the same project.
2. Bind its connection string to `DATABASE_URL`.
3. Keep the addon in the same environment as the service.

## Required secrets

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `PUBLIC_URL`

Optional:

- `SENTRY_DSN_API`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`
- `SENTRY_TRACES_SAMPLE_RATE`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT`
- `VITE_SENTRY_RELEASE`
- `VITE_SENTRY_TRACES_SAMPLE_RATE`
- `WHATSAPP_PROVIDER`
- `WHATSAPP_CLOUD_API_TOKEN`
- `WHATSAPP_CLOUD_PHONE_ID`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`

## Migration job

Create a manual Northflank job using the same repo/image or same build context:

```bash
corepack pnpm prisma:migrate:deploy
```

Run it before promoting a release that contains schema changes.

## Optional demo seed job

```bash
corepack pnpm seed
```

Use only for demo or staging environments.

## Deploy flow

1. Push code.
2. Let Northflank build the image from `Dockerfile`.
3. Run the migration job.
4. Deploy the combined service.
5. Verify `/healthz`.
6. Verify `/readyz`.
7. Open `/`, `/app` and `/b/demo-beleza`.

## Rollback

- roll back the service image tag in Northflank
- confirm database compatibility before rollback if migrations already ran
- prefer additive/backward-compatible migrations for safer release flow

## Logs and troubleshooting

- inspect service logs first for startup failures
- inspect migration job logs for schema errors
- inspect readiness failures for database reachability

## Common Prisma issues

- `openssl` mismatch:
  use the checked-in Debian slim image, not Alpine
- client not generated:
  ensure the image build runs `pnpm prisma:generate`
- runtime cannot reach DB:
  verify addon binding and `DATABASE_URL`
- startup before migrations:
  keep migrations in a separate manual job, not inside app startup

## References

- Northflank docs: https://northflank.com/docs
- Prisma deploy docs: https://www.prisma.io/docs/orm/prisma-client/deployment
