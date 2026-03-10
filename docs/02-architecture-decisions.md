# Architecture Decisions

Date: 2026-03-10

## ADR-001: preserve the current stack

Decision:

- Backend stays on Node.js + TypeScript + Fastify
- ORM stays Prisma
- Core database stays PostgreSQL
- Frontend stays React + Vite + Tailwind

Reason:

- the repo already contains meaningful domain work
- the production blockers were operational, not structural
- rewrite risk would be higher than hardening risk

## ADR-002: keep the core transactional model relational

Decision:

- appointments, staff, clients, payments, subscriptions, permissions and audit remain in PostgreSQL + Prisma

Reason:

- this domain needs transactions, uniqueness, constraints and predictable joins
- MongoDB and Convex are not appropriate replacements for the transactional core

## ADR-003: combined-service deployment for Northflank

Decision:

- package the web build and API in a single Node service for the default Northflank path

Implementation:

- Fastify now serves `apps/web/dist`
- frontend defaults to same-origin API calls
- health endpoints are `/healthz` and `/readyz`

Reason:

- this reduces routing complexity
- it matches Northflank combined-service expectations cleanly
- it keeps rollback and release flow simple

## ADR-004: Debian slim over Alpine for runtime stability

Decision:

- use `node:20-bookworm-slim` multi-stage Docker instead of Alpine

Reason:

- Prisma/OpenSSL/container compatibility is materially safer on Debian slim
- this reduces risk in build, runtime and migration jobs

## ADR-005: public booking must stay strictly production-bound

Decision:

- remove fallback payloads and synthetic booking paths from the public booking flow
- require every public booking route to resolve a real workspace slug in PostgreSQL

Reason:

- the user explicitly rejected demo-only flows
- payment, booking conflicts and audit trails only make sense against real tenant data
- production trust is higher when the public link always reflects a live workspace

## ADR-006: observability must be env-driven and optional

Decision:

- initialize Sentry only when DSNs are provided

Implementation:

- backend reads `SENTRY_DSN_API`, environment, release and sample rate
- frontend reads `VITE_SENTRY_DSN`, environment, release and sample rate

Reason:

- the repo must build cleanly in local, staging and production contexts
- production can turn on monitoring without code changes

## ADR-007: release-safe Prisma flow

Decision:

- build runs `prisma generate`
- production database changes should use `prisma migrate deploy`
- seed remains an optional manual bootstrap job only

Reason:

- non-interactive deploys are required in production
- migration application must be decoupled from container startup

## ADR-008: Convex is rejected for the core

Decision:

- do not move the core transactional domain to Convex
- Convex may only be reconsidered later as an optional realtime side-channel

Evidence:

- Convex MCP access returned `Not Authorized`, and no project is configured in this repo
- even with access, the current domain still belongs in PostgreSQL

## ADR-009: requested MCPs unavailable in this environment need explicit fallback

Decision:

- when a requested MCP is unavailable, use the nearest valid fallback and document it

Fallbacks used here:

- `github` -> local `git` and shell audit
- `notion` -> local docs plus Linear document
- `chrome-devtools` -> Playwright runtime audits
- `prisma-local` -> local schema/code inspection
- `shadcn` -> local design-system components and tokens
- `testsprite` -> local risk matrix in docs

## ADR-010: webhook trust must be explicit and replay-aware

Decision:

- Mercado Pago webhook processing now accepts either official `x-signature` validation or a constant-time shared secret fallback for controlled local/manual integrations
- replayed webhook signatures older than five minutes are rejected before domain processing

Reason:

- production payment callbacks need stronger authenticity checks than a plain string comparison
- controlled operator testing still needs a pragmatic fallback path
- event id deduplication alone is not sufficient against forged or stale requests

## ADR-012: authentication is first-class production infrastructure

Decision:

- password registration requires email verification before panel access
- password recovery uses one-time hashed tokens with expiry and revocation
- Google Sign-In is supported with backend token verification when `GOOGLE_CLIENT_ID` is configured

Reason:

- owner onboarding has to be real, not a seeded shortcut
- email verification reduces bad data and protects billing, reminders and workspace ownership
- Google Sign-In reduces friction for first access while preserving backend trust boundaries

## ADR-011: isolate BELEZAFOCO in a dedicated PostgreSQL schema on Northflank

Decision:

- keep the Northflank Postgres addon, but run BELEZAFOCO in schema `belezafoco` instead of `public`
- store `DATABASE_URL` with `schema=belezafoco` in the service environment
- use the addon admin connection only for one-time schema bootstrap when the runtime role cannot create schemas

Reason:

- the existing addon database was not empty and already contained unrelated tables in `public`
- Prisma `migrate deploy` correctly rejected the shared `public` schema with `P3005`
- schema isolation avoids name collisions, keeps the addon reusable and preserves least-privilege runtime access after bootstrap

## Final stack

- API: Fastify + Zod + Prisma + PostgreSQL
- Web: React + Vite + Tailwind
- Observability: optional Sentry backend/frontend
- E2E: Playwright smoke suite
- Infra: Debian slim Docker image for Northflank combined service
