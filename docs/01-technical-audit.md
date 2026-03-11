# Technical Audit

Date base: 2026-03-11

## Executive summary

BELEZAFOCO already had the correct commercial backbone: Fastify API, Prisma, PostgreSQL, React + Vite, multi-tenant workspaces, public booking, Pix flow, billing basics and a combined deploy path on Northflank. The gap was coherence: the Superdesign source of truth had moved ahead of the local implementation, the app shell was missing agenda/finance sections, and the financial domain was too shallow for the product the UI was promising.

This wave closed the first real production gap after auth hardening: the repository now includes a financial ledger foundation, new authenticated routes for agenda and finance, richer seed data for demo, updated Superdesign route context and a cleaner documentation baseline for the current production line.

## Inputs audited

- local repository tree and current worktree state
- Superdesign drafts and share flow for the active product project
- Prisma schema, migration history and seed script
- authenticated app routes, public booking routes and production deploy topology
- live validation through Chrome DevTools and Playwright
- official references through Context7 for Google token verification and Prisma runtime guidance
- MCP availability for Linear, Notion, Sentry, Figma, TestSprite and Convex

## Current production posture

### Strong foundations already present

- `apps/api` and `apps/web` remain the correct monorepo split.
- PostgreSQL is the production datasource.
- `Workspace` + `Membership` still define tenant and RBAC boundaries.
- Auth already supports email/password, verify-email, password reset, refresh tokens and Google ID token validation server-side.
- Combined Fastify + SPA serving remains valid for Northflank.
- The Docker base is already `bookworm-slim`, avoiding the old Prisma + Alpine friction.

### Gaps found before implementation

1. Superdesign drift
   - `.superdesign/init/routes.md` and `.superdesign/init/pages.md` were stale and did not reflect `/app/setup`, `/app/billing`, or the new cockpit derivatives.
   - The approved drafts existed remotely but the local route map was behind them.

2. Product surface mismatch
   - The authenticated shell exposed cockpit/setup/billing only.
   - Agenda and financeiro, which were already implied by the product story and dashboard composition, were missing as first-class routes.

3. Financial domain too light
   - The schema had booking, payment and billing primitives, but no canonical ledger, no categories, no cost centers and no cash closure model.
   - That prevented a credible premium finance page and left the UI promising more than the backend could support.

4. Tooling drift around Prisma
   - The app runtime stays healthy on Prisma 5, but `prisma-local` runs Prisma CLI 7 and surfaced the known datasource config mismatch.
   - The correct decision is controlled hardening, not opportunistic stack churn during a production wave.

5. External production blocker still active
   - Google OAuth is correct inside the codebase and `/auth/config` now returns `googleEnabled: true` when envs align.
   - The remaining live failure is still external platform propagation / Google Cloud origin authorization on the published domain.

## Implementation delivered in this audit wave

### Backend

- Added financial enums and models in `apps/api/prisma/schema.prisma`:
  - `FinancialCategory`
  - `CostCenter`
  - `FinancialEntry`
  - `CashClosure`
- Added migration `20260311103000_finance_ledger_foundation`.
- Added finance module routes:
  - `GET /me/finance/dashboard`
  - `GET /me/finance/entries`
  - `PATCH /me/finance/entries/:id`
  - `POST /me/finance/entries`
  - `GET /me/finance/commissions`
  - `POST /me/finance/cash-closures`
  - `GET /me/finance/export.csv`
- Linked the new ledger to live business flows:
  - public booking now creates or updates appointment receivable entries
  - Mercado Pago webhook reconciliation now updates the linked ledger entry
  - receptionist status changes on appointments now re-sync the financial entry
- Hardened `writeAudit()` to stringify structured payloads instead of relying on unsafe casts.

### Frontend

- Added `/app/agenda` with operational filters, receptionist actions and CSV export.
- Added `/app/financeiro` with:
  - executive financial summary
  - category breakdown
  - live ledger feed
  - manual entry form
  - cash closure form
  - projected commission view
- Expanded `AppShell` navigation to match the cockpit language from Superdesign:
  - cockpit
  - agenda
  - financeiro
  - setup
  - billing
  - public link
- Added local editorial assets:
  - `apps/web/public/demo/agenda-board.svg`
  - `apps/web/public/finance/ledger-orbit.svg`

### Demo data

- Seed now includes:
  - finance categories and cost centers
  - paid and pending receivables
  - a realistic manual expense
  - a projected commission entry
  - a cash closure snapshot

## Open risks after this wave

1. Google OAuth public popup
   - still depends on final Google Cloud origin propagation for the live domain

2. Prisma tooling split
   - runtime is healthy, but Prisma CLI 7 remains a documented upgrade path rather than the active runtime baseline

3. Notion MCP availability
   - Notion remains blocked by auth, so repo docs continue as the authoritative working documentation

4. Convex MCP availability
   - Convex remains unauthorized and rejected as transactional core

## Validation status

- `corepack pnpm --filter @belezafoco/api prisma:generate`
- `corepack pnpm --filter @belezafoco/api build`
- `corepack pnpm --filter @belezafoco/api test`
- `corepack pnpm --filter @belezafoco/web build`
- `corepack pnpm --filter @belezafoco/web test`

All of the above passed at the end of this wave.
