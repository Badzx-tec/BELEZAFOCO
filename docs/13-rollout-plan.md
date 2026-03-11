# Rollout Plan

Date base: 2026-03-11

## Current wave shipped

- financial ledger schema and migration
- finance module API
- agenda cockpit page
- finance cockpit page
- updated demo seed
- refreshed Superdesign route/page context

## Production promotion order

1. Apply Prisma migration `20260311103000_finance_ledger_foundation`
2. Run `pnpm prisma:generate`
3. Run API + web builds
4. Run API + web tests
5. Deploy combined service to Northflank
6. Validate:
   - `/healthz`
   - `/readyz`
   - `/auth/config`
   - `/app/agenda`
   - `/app/financeiro`
7. Run smoke validation on the published domain

## Post-deploy manual checks

- Google origin propagation on the published domain
- Mercado Pago webhook end-to-end with a real Pix notification
- WhatsApp webhook verification and template send
- finance export CSV download
- verify-email flow on the public domain

## Rollback rule

- if the new finance migration is the issue, roll back the application release first and keep the schema change documented
- if the issue is only visual or SPA-related, revert the frontend release path while keeping the backend stable
- if the issue is Google OAuth only, do not roll back the app; correct Google Cloud origin config instead
