# BELEZAFOCO Technical Audit

Date: 2026-03-10

## Executive summary

BELEZAFOCO already had a usable SaaS foundation: Fastify, Prisma, PostgreSQL schema, React/Vite, JWT auth, workspace-based tenancy, billing scaffolding, public booking, dashboard modules and demo seed data. The right decision was to preserve that base and harden it for production instead of rewriting the product.

The highest-value blockers discovered in the current repo were not framework choice. They were operational:

- root workspace scripts depended on `pnpm` being globally available
- the Docker image only launched the API and used a fragile Alpine single-stage setup
- the frontend assumed an external API host by default, which made same-origin production harder
- the public booking page was not demo-safe when the backend was unavailable
- recursive test execution failed when a package had no test files
- the repo lacked Northflank-specific deployment documentation and release flow guidance

## Current repo state

- Monorepo: `apps/api`, `apps/web`, `packages/shared`
- Backend: Node.js + TypeScript + Fastify + Zod + Prisma
- Frontend: React + TypeScript + Vite + Tailwind
- Database schema: PostgreSQL-first Prisma schema with workspace isolation
- Existing test coverage: scheduler, plan enforcement, permissions, reminder dedupe
- Existing docs: initial audit, deploy notes and sales notes, but not aligned to Northflank or final production flow

## Strengths worth preserving

- Fastify is a strong fit for APIs, webhooks and booking flows
- Prisma schema already models the core transactional domain well
- Workspace + membership + role structure is valid for SMB multi-tenant SaaS
- Public booking, payments, waitlist and dashboard concepts already exist
- The frontend had a solid stylistic direction emerging in the current worktree

## Weak points

- Docker/runtime was not ready for a combined-service Northflank deploy
- The API did not serve the built frontend, so production hosting was fragmented
- No `/healthz` and `/readyz` endpoints for standard platform health checks
- Frontend API defaults favored local absolute URLs instead of same-origin deployment
- Public booking could not act as a resilient sales/demo flow without a live API
- Observability scaffolding was missing from code
- E2E coverage was absent from the repository
- Several requested MCPs were not available in this environment

## What blocked production

- unstable release workflow for Prisma in containers
- no clearly documented migration job strategy for Northflank
- missing combined-service packaging of web + API
- no health/readiness contract for platform checks
- no optional Sentry initialization in backend/frontend
- no repository-level Playwright smoke suite
- no demo-safe public booking path for portfolio/commercial demos

## What was preserved

- Fastify modular API structure
- Prisma/PostgreSQL core
- Workspace tenancy model
- existing dashboard/landing/public booking directions
- current local frontend improvements in the working tree

## What was refactored or added in this mission

- root scripts now use `corepack pnpm`, which removes dependency on a global `pnpm`
- `packages/shared` and `apps/web` tests no longer fail recursive execution when no unit tests exist
- Docker moved to a Debian slim multi-stage image with Prisma-friendly runtime assumptions
- API now exposes `/healthz` and `/readyz`
- API now serves the built frontend so Northflank can run a single combined Node service
- frontend API client now defaults to same-origin requests
- public booking gained demo fallback data and a usable Pix-oriented reservation flow without backend availability
- local visual assets were added under `apps/web/public/marketing` and `apps/web/public/niches`
- optional Sentry initialization was added to backend and frontend behind env flags
- Playwright smoke tests were added and executed successfully

## Risks that still remain

- WhatsApp Cloud API and Mercado Pago providers are still scaffolded more heavily in docs/architecture than in a fully credentialed production implementation
- Northflank deployment was prepared but not executed from this environment because there is no Northflank MCP or authenticated CLI session here
- no real PostgreSQL instance was available locally during this session, so API runtime was validated by build/tests and demo-safe frontend fallback rather than a live DB-backed smoke
- formal load testing and webhook replay tests are still pending

## Phase plan

### Phase 1: foundation and release safety

- stabilize scripts, build and recursive tests
- harden Dockerfile for Prisma on Debian slim
- align API/frontend for same-origin combined service
- publish ADRs and Northflank runbooks

### Phase 2: premium UX and demo readiness

- add local marketing assets and stronger visual sections
- make booking publicly demonstrable without infra dependencies
- validate landing/dashboard/booking with Playwright

### Phase 3: production integration hardening

- finish real WhatsApp Cloud API provider
- finish real Mercado Pago Pix provider and secure webhook verification
- add replay-safe reconciliation and delivery logs

### Phase 4: operational maturity

- provision Sentry DSNs and release metadata
- run Northflank migration/seed jobs
- validate production smoke against live Postgres

## Research references

- Fresha: https://www.fresha.com
- Booksy: https://booksy.com
- Vagaro: https://www.vagaro.com/pro
- GlossGenius: https://glossgenius.com
- Trinks: https://trinks.com
- AgendaPro: https://agendapro.com
- Prisma docs on production deploy and migrate deploy: https://www.prisma.io/docs
- Northflank docs on combined services, jobs, secrets and health checks: https://northflank.com/docs
- Mercado Pago docs on Checkout API, Pix and webhooks: https://www.mercadopago.com.br/developers
- Sentry JavaScript docs: https://docs.sentry.io/platforms/javascript
