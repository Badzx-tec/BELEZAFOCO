# Changelog

## 2026-03-10

- hardened workspace scripts to use `corepack pnpm` and fixed recursive test execution for packages without unit tests
- replaced the old Alpine Docker image with a Debian slim multi-stage image prepared for Prisma and Northflank combined-service deploys
- exposed `/healthz` and `/readyz` and made Fastify serve the built frontend for same-origin production hosting
- switched the frontend API client to same-origin by default
- added local marketing and niche SVG assets plus favicon for stronger visual positioning
- upgraded landing and public booking with richer visual sections and demo-safe booking fallback
- added optional env-driven Sentry initialization to backend and frontend
- added Playwright smoke coverage for landing, dashboard and public booking demo
- hardened the API with `@fastify/helmet`, production proxy awareness and Mercado Pago webhook signature validation helpers
- replaced the mock-only Mercado Pago Pix provider with a real API-backed flow plus official webhook reconciliation
- tracked `pnpm-lock.yaml` in Git so Northflank Docker builds receive a complete workspace context
- disabled `index.html` auto-registration in `@fastify/static` to avoid duplicate `HEAD /` conflicts during production boot
- restricted tenant auth enforcement to `/me` and `/admin` so the Northflank combined service can serve the public SPA, booking flow and static assets without `401`
- added server-side `demo-beleza` fallback data for public booking so the Northflank demo works even before the optional seed job runs
- created production documentation set in `docs/01` through `docs/10`
- created Linear project, PRD document and backlog issues for the productionization effort

## 2026-03-09

- documentada a auditoria tecnica do repositorio
- definida a arquitetura alvo preservando Fastify + Prisma + React e migrando o core para PostgreSQL
- migrado o schema Prisma para PostgreSQL com migration baseline versionada
- adicionados onboarding/workspace reforcado, calendario com bloqueios e dashboard summary no backend
- adicionados refresh token persistido, RBAC explicito, webhook idempotente e booking publico com lock transacional
- atualizado seed para demo comercial com servicos, equipe, agenda, bloqueio e pagamento pendente
- refeitas landing page, dashboard e pagina publica de agendamento com UX premium em pt-BR
- atualizados `README`, `DEPLOY_DIGITALOCEAN.md`, `docker-compose.yml` e scripts de backup/restore PostgreSQL
- removido o acoplamento com `@fastify/sensible` para compatibilizar o runtime com Fastify 5
- corrigidos os caminhos reais de `start` e jobs para `dist/src/...` no build TypeScript
