# Northflank Deploy Guide

## Target shape

- one combined service built from the root `Dockerfile`
- one Postgres addon with a dedicated app schema
- one manual migration job

## Verified deployment

- public URL validated on March 10, 2026: `https://p03--belezafoco-api--fdzfclqyqq99.code.run`
- verified endpoints:
  - `/`
  - `/auth`
  - `/healthz`
  - `/readyz`
- first production bootstrap was executed from a live pod shell because the existing addon reused a non-empty `public` schema
- create the manual migration job next before shipping further schema changes

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
4. If the addon database is shared or already has unrelated tables in `public`, append `schema=belezafoco` to `DATABASE_URL`.

Example:

```text
postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require&schema=belezafoco
```

One-time bootstrap for shared addons:

```bash
cd apps/api
echo 'CREATE SCHEMA IF NOT EXISTS belezafoco AUTHORIZATION "APP_USERNAME";' \
  | DATABASE_URL="$POSTGRES_URI_ADMIN" node_modules/.bin/prisma db execute --stdin --schema prisma/schema.prisma
DATABASE_URL="$DATABASE_URL" node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma
```

Notes:

- `POSTGRES_URI_ADMIN` is available from the Northflank addon connection details and should be used only for bootstrap or controlled recovery
- after the schema exists and is owned by the runtime user, the service can keep using the regular `DATABASE_URL`

## Required secrets

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `PUBLIC_URL`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

Optional:

- `RUN_MIGRATIONS_ON_START=true` only as a temporary fallback when the manual migration job is not yet available
- `GOOGLE_CLIENT_ID`
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
- `POSTGRES_URI_ADMIN` only for first-time bootstrap or recovery on shared addons

## Migration job

Create a manual Northflank job using the same repo/image or same build context:

```bash
pnpm --filter @belezafoco/api exec prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

Run it before promoting a release that contains schema changes.
If the job reuses the service environment, keep `DATABASE_URL` stored with `schema=belezafoco`.

## Temporary fallback for migrations

- if the manual job is not available yet, set `RUN_MIGRATIONS_ON_START=true`
- the checked-in container entrypoint will run `pnpm --filter @belezafoco/api exec prisma migrate deploy --schema apps/api/prisma/schema.prisma` before starting the API
- keep the `prisma` CLI installed in the API runtime image while this fallback exists
- remove or disable this flag after the dedicated job exists and the schema is current

## Deploy flow

1. Push code.
2. Let Northflank build the image from `Dockerfile`.
3. Bootstrap `belezafoco` schema once if the addon `public` schema is already occupied.
4. Run the migration job.
5. Configure auth envs for registration and Google Sign-In.
6. Deploy or restart the combined service.
7. Verify `/healthz`.
8. Verify `/readyz`.
9. Open `/` and `/auth`.
10. Register a real owner account or sign in with Google if configured.
11. Validate one real public booking slug created by onboarding.

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
- `P3005` on first migration:
  the current schema is not empty; move the app to a dedicated schema such as `belezafoco`
- `permission denied for database` while using `schema=belezafoco`:
  bootstrap the schema once with `POSTGRES_URI_ADMIN`, ownership set to the runtime user
- startup before migrations:
  keep migrations in a separate manual job, not inside app startup

## References

- Northflank docs: https://northflank.com/docs
- Prisma deploy docs: https://www.prisma.io/docs/orm/prisma-client/deployment
