# Architecture Decisions

Date base: 2026-03-11

## ADR-001: Core transactions stay on Fastify + Prisma + PostgreSQL

Status: adopted

Reason:

- the current stack already supports auth, booking, billing, audit and webhook flows
- the delivery problem is coherence and hardening, not stack mismatch
- moving the transactional core would slow production readiness without solving current blockers

## ADR-002: `Workspace` remains the canonical tenant boundary

Status: adopted

Rule:

- every authenticated operation resolves `workspaceId` server-side
- `Membership.role` remains the RBAC source of truth
- every finance, booking, billing and auth mutation must continue to enforce workspace ownership

## ADR-003: Superdesign is the visual source of truth

Status: adopted

Rule:

- the approved Superdesign project is the primary UI/UX reference
- pages without explicit drafts must inherit the same visual system rather than inventing a new language
- `.superdesign/init/*` must stay synchronized with the implemented route map

## ADR-004: Northflank combined service remains the production topology

Status: adopted

Rule:

- one service serves the compiled SPA and the Fastify API
- migrations and workers stay as separate jobs where possible
- `RUN_MIGRATIONS_ON_START` is a bridge only, not the preferred steady-state release path

## ADR-005: Auth model stays on `User.passwordHash + User.googleSub`

Status: adopted

Rule:

- this wave preserves the current auth identity shape
- Google login continues to validate the ID token on the server
- when Google returns the same verified email as an existing password account, the account is linked instead of duplicated
- no generic identity table is introduced in this production wave

## ADR-006: Google Sign-In is gated by published origin

Status: adopted

Rule:

- `/auth/config` only exposes Google Sign-In when the current origin is authorized
- `GOOGLE_ALLOWED_ORIGINS`, `PUBLIC_URL`, `API_BASE_URL` and `APP_URL` remain part of the deployment checklist
- the remaining public OAuth blocker is treated as an external platform gate, not a backend bug

## ADR-007: Financial module uses a ledger core

Status: adopted

Rule:

- the financial module is anchored on `FinancialEntry`
- categories and cost centers are first-class models
- appointment receivables are synced from booking/payment flows
- manual receivables, expenses, commissions, adjustments and payouts are represented in the same ledger
- cash closure is a separate aggregate over paid entries

Reason:

- this is the minimum production-ready shape that supports finance UI fidelity, auditability and future reporting

## ADR-008: Internal plan ids remain `trial`, `basic`, `pro`

Status: adopted

Rule:

- backend and enforcement continue to use stable ids
- frontend and commercial docs translate them as:
  - `trial` => Fundador Solo
  - `basic` => Fundador Equipe Pequena
  - `pro` => Fundador Pro

## ADR-009: Prisma runtime stability beats opportunistic tool churn

Status: adopted

Rule:

- runtime stays on the stable app-managed Prisma 5 line for now
- the Prisma CLI 7 config gap is documented and isolated as tooling debt
- production delivery does not pause for a broad Prisma upgrade during this wave

## ADR-010: Notion is temporarily non-authoritative

Status: adopted

Rule:

- repository docs are the live source of truth until Notion auth is restored
- once access returns, key docs may be mirrored into Notion, but the repo remains authoritative for engineering rollout

## ADR-011: Convex is rejected as transactional core

Status: adopted

Reason:

- Convex MCP remains unauthorized in this workspace
- no current requirement justifies a second operational core
- if real-time gets adopted later, it must stay additive only
