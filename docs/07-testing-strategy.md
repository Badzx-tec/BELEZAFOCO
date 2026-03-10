# Testing Strategy

## Layers

- unit tests for scheduler, plans, permissions and dedupe
- integration tests for auth, booking, payment webhook and tenant boundaries
- Playwright smoke/E2E for landing, auth and public booking error handling
- manual operational smoke for release validation on Northflank

## Current automated coverage

- `apps/api/tests/scheduler.test.ts`
- `apps/api/tests/plan.test.ts`
- `apps/api/tests/permissions.test.ts`
- `apps/api/tests/reminder-dedupe.test.ts`
- `tests/e2e/belezafoco.smoke.spec.ts`

## Critical scenarios

- password registration with email verification
- Google Sign-In with backend token verification
- password reset and refresh token rotation
- onboarding summary and workspace profile update
- public booking with real tenant slug resolution
- appointment conflict prevention
- role enforcement
- tenant isolation
- payment webhook idempotency
- dashboard smoke states

## Regression checklist

- `corepack pnpm test`
- `corepack pnpm test:e2e`
- Playwright MCP visual smoke on `/`, `/auth` and one real `/b/:slug`
- confirm zero console errors on landing and auth

## Risk matrix

- High:
  auth token lifecycle, booking conflict logic, webhook idempotency, tenant isolation
- Medium:
  onboarding completeness, dashboard summaries, reminder dispatch
- Low:
  static marketing sections, empty states and copy drift

## Gaps to close next

- live DB-backed API smoke in CI or staging
- payment provider integration tests with sandbox credentials
- WhatsApp provider integration tests with webhook replay fixtures
