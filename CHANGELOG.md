# Changelog

## 2026-03-11

- hardened `/auth/config` so Google Sign-In is only exposed when the current published origin is authorized
- added `GOOGLE_ALLOWED_ORIGINS` to the backend environment contract and Northflank examples
- updated the auth page to surface the real Google status (`Ativo`, `Bloqueado`, `Pendente`) instead of a generic pending state
- added `id` and `name` to auth inputs to remove the production accessibility warning seen in Chrome DevTools
- added `apps/api/src/modules/auth/publicAuthConfig.ts` plus focused unit coverage for the origin-gating logic
- stabilized `apps/api/tests/idempotency.test.ts` so the API suite no longer fails because auth envs are missing during import
- made API env loading search both package-local and workspace-root `.env` files, fixing the monorepo-root startup crash seen in logs
- created new urgent Linear issues `THA-16`, `THA-17` and `THA-18` for production auth, Prisma/Northflank and readiness work
- created Notion delta pages for production findings and rollout updates
- generated a Figma flow artifact for the commercial production path and opened a Superdesign project for premium auth work
- refreshed `docs/01-technical-audit.md`, `docs/02-architecture-decisions.md`, `docs/04-northflank-deploy.md` and `docs/10-mcp-usage-log.md`
- removed dead backend booking/resource-capacity code and the legacy test that no longer matched the production booking core
- restored missing frontend runtime dependencies (`react-hook-form`, `zod`, `@tanstack/react-query`, `@hookform/resolvers`, `@sentry/vite-plugin`) and brought `apps/web` back to a clean production build
- mapped the approved Superdesign remote project to the local routes in `docs/17-superdesign-frontend-map.md`
- applied the provided production Google client id to the local runtime env and documented the exact allowed-origin rollout for Google Cloud Console and Northflank

## 2026-03-10

- hardened workspace scripts to use `corepack pnpm` and fixed recursive test execution for packages without unit tests
- replaced the old Alpine Docker image with a Debian slim multi-stage image prepared for Prisma and Northflank combined-service deploys
- exposed `/healthz` and `/readyz` and made Fastify serve the built frontend for same-origin production hosting
- switched the frontend API client to same-origin by default
- added local marketing and niche SVG assets plus favicon for stronger visual positioning
- upgraded landing and public booking with richer visual sections and a production-first public flow
- added optional env-driven Sentry initialization to backend and frontend
- added initial Playwright smoke coverage for landing, dashboard and public booking
- hardened the API with `@fastify/helmet`, production proxy awareness and Mercado Pago webhook signature validation helpers
- replaced the mock-only Mercado Pago Pix provider with a real API-backed flow plus official webhook reconciliation
- tracked `pnpm-lock.yaml` in Git so Northflank Docker builds receive a complete workspace context
- disabled `index.html` auto-registration in `@fastify/static` to avoid duplicate `HEAD /` conflicts during production boot
- restricted tenant auth enforcement to `/me` and `/admin` so the Northflank combined service can serve the public SPA, booking flow and static assets without `401`
- temporarily added a public booking fallback while Northflank bootstrap was being stabilized
- finalized the live Northflank rollout by isolating the app in PostgreSQL schema `belezafoco`, applying Prisma migrations in production and validating the public booking + Pix-style flow on the public domain
- created production documentation set in `docs/01` through `docs/10`
- created Linear project, PRD document and backlog issues for the productionization effort
- replaced placeholder auth with production registration, email verification, password reset and protected dashboard sessions
- added backend Google Sign-In verification flow, ready to activate with `GOOGLE_CLIENT_ID`
- removed public booking fallbacks from frontend and backend so only real workspace slugs can book
- updated seed/bootstrap defaults away from placeholder workspace slugs and marked owner seed users as verified
- allowed Google Identity Services through the production CSP so Google Sign-In can render on the live auth page
- allowed the Google Identity Services stylesheet through the production CSP so the sign-in button can mount cleanly
- disabled edge caching on the SPA HTML entry so auth and app deploys do not serve stale index responses after rollout
- changed reminder delivery defaults to fail closed in production instead of silently using mock WhatsApp delivery
- added API Vitest serialization and refreshed Playwright smoke coverage for landing, auth and public booking failure states
- added `RUN_MIGRATIONS_ON_START` container support as a controlled bridge until the dedicated Northflank migration job is created
- fixed the Northflank startup migration path by shipping the Prisma CLI in the API runtime image and invoking it through `pnpm --filter @belezafoco/api exec prisma --schema prisma/schema.prisma`
- fixed production SPA deep links for `/auth`, `/auth/verify-email` and `/auth/reset-password` so direct access works behind the combined Fastify service
- reconciled the premium Northflank branch with production hardening for `DIRECT_URL`, Prisma deploy scripts and combined-service startup
- restored the reserved `demo-beleza` fallback in the merged premium public booking flow for commercial smoke tests on Northflank
- switched Mercado Pago webhook notification URLs to prefer `API_BASE_URL` over the marketing origin
- replaced the WhatsApp production placeholder with a real Cloud API template sender plus Meta webhook verification and event persistence
- updated reminder dispatch to resolve approved template names from `MessageTemplate`

## 2026-03-09

- documentada a auditoria tecnica do repositorio
- definida a arquitetura alvo preservando Fastify + Prisma + React e migrando o core para PostgreSQL
- migrado o schema Prisma para PostgreSQL com migration baseline versionada
- adicionados onboarding/workspace reforcado, calendario com bloqueios e dashboard summary no backend
- adicionados refresh token persistido, RBAC explicito, webhook idempotente e booking publico com lock transacional
- atualizado seed operacional com servicos, equipe, agenda, bloqueio e pagamento pendente
- refeitas landing page, dashboard e pagina publica de agendamento com UX premium em pt-BR
- atualizados `README`, `DEPLOY_DIGITALOCEAN.md`, `docker-compose.yml` e scripts de backup/restore PostgreSQL
- removido o acoplamento com `@fastify/sensible` para compatibilizar o runtime com Fastify 5
- corrigidos os caminhos reais de `start` e jobs para `dist/src/...` no build TypeScript
