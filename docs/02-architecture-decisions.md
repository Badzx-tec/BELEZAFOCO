# Architecture Decisions

Date base: 2026-03-11

## ADR-001: Core transactions stay on Fastify + Prisma + PostgreSQL

Status: adopted

Reason:

- the current stack already supports tenant-aware auth, booking, audit and payment workflows
- the main problem is production hardening, not a stack mismatch
- moving the core to Convex, MongoDB or another backend would slow delivery without solving the current blockers

## ADR-002: `Workspace` remains the canonical tenant

Status: adopted

Rule:

- every authenticated operation must resolve `workspaceId` server-side
- memberships stay as the RBAC source of truth
- any lookup by resource id must continue to enforce workspace ownership

## ADR-003: Convex is rejected as a transactional core

Status: adopted

Reason:

- Convex MCP returned unauthorized for this workspace
- there is no current real-time requirement strong enough to justify a second operational core
- if used later, Convex must stay complementary only

## ADR-004: Northflank combined service stays the primary topology

Status: adopted

Rule:

- one published service serves the compiled SPA and the Fastify API
- reminders, reconciliation and migrations stay as separate jobs where possible
- `RUN_MIGRATIONS_ON_START` remains a controlled fallback, not the default release path

Reason:

- the live environment is already operating in this shape
- the official Northflank guidance for Docker services + jobs fits this model well

## ADR-005: Runtime and migration connections stay split

Status: adopted

Rule:

- `DATABASE_URL` is the runtime connection
- `DIRECT_URL` is reserved for migrations and direct CLI work
- docs and env examples must keep this split explicit

Reason:

- Prisma recommends direct connections for migrate flows, especially around poolers

## ADR-006: Google Sign-In is gated by the published origin

Status: adopted

Rule:

- `/auth/config` must not expose an active Google Sign-In button when the current published origin is not authorized
- the backend must derive the live origin from request headers and compare it against `GOOGLE_ALLOWED_ORIGINS`, `PUBLIC_URL`, `API_BASE_URL` and `APP_URL`
- the frontend must surface the real operational state instead of a generic pending badge

Reason:

- production browser validation showed a real Google button failing publicly with `The given origin is not allowed for the given client ID`
- a broken acquisition button is worse than a disabled one with an explicit operator message

## ADR-007: Monorepo env loading must be cwd-agnostic

Status: adopted

Rule:

- API env loading must search both package-local and workspace-root `.env` files
- container and platform-provided envs still win because dotenv uses `override: false`

Reason:

- local logs showed the API crashing when started from the monorepo root because JWT secrets were not loaded

## ADR-008: Prisma 7 compatibility is tracked as a planned upgrade, not an emergency runtime migration

Status: adopted

Rule:

- the current release line can stay on Prisma 5 runtime packages while the team documents the Prisma 7 datasource migration path
- the Prisma 7 move must be done as a controlled upgrade with `prisma.config.ts` and full repo validation, not as an opportunistic hotfix

Reason:

- `prisma-local` surfaced a real compatibility gap with Prisma CLI 7.4.2
- the live runtime issue this round was auth acquisition, not an active runtime crash caused by Prisma 5

## ADR-009: Mercado Pago and WhatsApp integrations stay adapter-based

Status: adopted

Rule:

- Mercado Pago continues through direct HTTP requests and secure webhook validation
- WhatsApp Cloud API continues through provider abstraction, template mapping and webhook verification
- credentials remain server-side only

Reason:

- adapter-based integrations are easier to observe, retry and audit than opaque SDK-heavy flows in this codebase
