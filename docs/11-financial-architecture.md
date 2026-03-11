# Financial Architecture

Canonical financial architecture for the production rollout.

## Core decisions

- PostgreSQL + Prisma remain the transactional core.
- The financial module now uses an explicit workspace-scoped ledger instead of inferring everything from `Appointment` and `Payment`.
- Auditability is mandatory for billing, manual entries, closures, commissions and webhook-driven updates.

## Canonical models

- `FinancialCategory`
- `CostCenter`
- `FinancialEntry`
- `CashClosure`

## Ledger rules

- Every entry belongs to one workspace.
- Direction is explicit: `inflow` or `outflow`.
- Kind is explicit: receivable, expense, commission, payout or adjustment.
- Status is explicit: `pending`, `paid`, `cancelled`, `overdue`.
- Appointment and payment-linked receivables are synchronized into the ledger.
- Manual entries and closures are created through authenticated workspace APIs only.

## Current rollout

- Finance dashboard reads from the ledger foundation.
- Public booking and Mercado Pago reconciliation now synchronize appointment receivables.
- Appointment status changes also synchronize the linked financial entry.
- Demo seed includes categories, cost centers, receivables, expenses, commissions and one cash closure.

## Next hardening steps

- Add dedicated tests for finance route mutations and ledger synchronization.
- Expand closures with counted-cash variance reporting.
- Add payable scheduling and richer commission statements.
- Add PDF export after CSV stabilizes in production.

## Notes

- This file is the canonical replacement for the older draft stored in [12-financial-architecture.md](/c:/Users/JUAN/Documents/BELEZAFOCO/docs/12-financial-architecture.md).
