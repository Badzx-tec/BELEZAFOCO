# Technical Audit

Date base: 2026-03-11

## Executive summary

BELEZAFOCO already has the right production backbone for a beauty SaaS: `pnpm` monorepo, Fastify API, Prisma + PostgreSQL, React + Vite frontend, multi-tenant workspaces, public booking, payment hooks, reminders, health endpoints and a combined-service deployment path.

The current production posture is still uneven. The most important live issue found in this pass was not only data or infra related: the published `/auth` page on `code.run` was exposing Google Sign-In while Google rejected the active origin with `400` (`The given origin is not allowed for the given client ID`). That breaks acquisition on a public flow. In parallel, `prisma-local` exposed a future Prisma CLI 7 compatibility gap around datasource config, and local API startup logs showed env loading was too dependent on the working directory.

## Audit inputs

- local workspace tree and git state
- GitHub MCP repository mirror and branch inventory
- Prisma schema, migrations and package versions
- Dockerfile, start script and env examples
- production browser validation with Chrome DevTools and Playwright
- official references via Context7 and web for Prisma, Northflank, Mercado Pago and WhatsApp
- Linear backlog, Notion pages, Sentry projects/DSNs, shadcn registry, Figma diagram tooling and TestSprite attempts

## Confirmed current state

### Healthy foundations

- PostgreSQL is already the primary datasource in `apps/api/prisma/schema.prisma`.
- Workspaces and memberships remain the canonical tenant boundary.
- Backend modules are split by business domain and already cover auth, booking, payments, messaging, billing and dashboard summaries.
- The API test suite is healthy after the auth and env hardening done in this pass.
- The Docker base image is already `node:20-bookworm-slim`, which is the correct direction for Prisma and Northflank.

### Production blockers and risks

1. Public auth was broken on the live domain.
   - Chrome DevTools and Playwright reproduced a Google Identity Services `400`.
   - The live page showed a real Google button even when the domain was not authorized.
   - Form inputs also triggered accessibility issues because they lacked `id` or `name`.

2. API env loading was brittle in the monorepo.
   - `api-live.log` showed the API crashing without `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
   - Root-level monorepo execution was not consistently loading `.env`.

3. Prisma tooling is split across generations.
   - The project runtime is still on Prisma 5.
   - `prisma-local` runs Prisma CLI 7.4.2 and failed on `url` / `directUrl` in the datasource block.
   - This is a tooling and upgrade-path risk, even when the application runtime still works.

4. Full repo build remains partially red outside the touched flow.
   - `apps/api` has legacy type and schema drift outside auth.
   - `apps/web` still has stale files like `AuthExperience.tsx` referencing removed APIs and missing deps.
   - These are pre-existing debt items and were not introduced by this patch set.

## Structural work delivered in this pass

### Production auth hardening

- Added origin-aware Google Sign-In gating through `apps/api/src/modules/auth/publicAuthConfig.ts`.
- `/auth/config` now derives the published origin from request headers and only exposes the Google client id when the current origin is allowed.
- Added `GOOGLE_ALLOWED_ORIGINS` to the backend env contract for preview + production alignment.
- Updated the auth UI to show the real Google status: `Ativo`, `Bloqueado`, or `Pendente`.
- Added `id` and `name` to auth form inputs to remove the production console warning.

### Monorepo env loading hardening

- Reworked `apps/api/src/config/env.ts` to search `.env` from both package and workspace-root candidates.
- Verified from the repo root that the API can now resolve JWT secrets without leaking values.

### Test stability hardening

- Added `apps/api/tests/public-auth-config.test.ts` for origin gating coverage.
- Fixed `apps/api/tests/idempotency.test.ts` so it no longer fails due to missing auth envs during import.
- Current API result: `31` tests passing in `12` files.

## Live validation performed

- Production URL checked: `https://p03--belezafoco-api--fdzfclqyqq99.code.run/auth`
- Chrome DevTools findings:
  - Google Sign-In origin mismatch error
  - missing `id` / `name` warning in auth fields
  - `GET /auth/config` confirmed on the live app
- Playwright findings:
  - same Google origin rejection reproduced
  - auth page structure and public content loaded correctly

## External tooling findings

- Linear project already existed and received new urgent issues `THA-16`, `THA-17`, `THA-18`.
- Notion already had PRD and rollout pages; two delta pages were created for this pass.
- Sentry org `thark-s4` already has `belezafoco-api` and `belezafoco-web` projects with DSNs available for deployment wiring.
- Superdesign CLI is installed and authenticated, but draft generation is currently blocked by insufficient team credits.
- Convex MCP is not authorized and remains rejected as a core dependency.
- TestSprite is only partially usable in this workspace because its expected summary/PRD artifacts are missing.

## Remaining risks

- Google Cloud Console still needs the active production domain added to Authorized JavaScript origins.
- Prisma 7 migration compatibility remains documented but not yet implemented end-to-end.
- Full repo typecheck/build is still red due to older debt outside the auth flow.
- Northflank redeploy and live validation still depend on external platform access and secrets rotation.

## Recommended next steps

1. Apply `GOOGLE_ALLOWED_ORIGINS`, `PUBLIC_URL` and `API_BASE_URL` consistently in Northflank.
2. Add the live domain to Google Cloud Console and redeploy before promoting the Google acquisition flow.
3. Triage the wider TypeScript drift in `apps/api` and stale frontend files so full builds become reliable.
4. Decide whether to keep Prisma 5 for the next release or schedule a controlled Prisma 7 upgrade with `prisma.config.ts`.
5. Run a fresh browser smoke pass after redeploy to confirm `/auth/config` returns `googleEnabled=true` on the intended production origin.
