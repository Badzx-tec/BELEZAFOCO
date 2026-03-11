# Financial Architecture

Direção:

- PostgreSQL + Prisma como core
- ledger auditável por workspace
- entidades futuras: `FinancialAccount`, `LedgerEntry`, `Receivable`, `Payable`, `CashClosure`, `CommissionStatement`
- toda mutação financeira deve gerar trilha de auditoria
