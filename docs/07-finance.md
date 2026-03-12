# 07. Finance

## Estrutura
- `FinancialAccount`
- `Receivable`
- `Payable`
- `LedgerEntry`
- `CashSession`
- `CommissionRule`
- `CommissionStatement`
- `ExpenseCategory`
- `RevenueCategory`
- `CostCenter`

## Regras
- Ledger imutavel.
- Ajustes entram como `adjustment`.
- Recebiveis podem ser ligados a booking, cliente e profissional.
- Pagamentos podem ligar booking, recebivel e eventos externos.
- Comissao tem regra configuravel e demonstrativo por periodo.

## Telas ja criadas
- dashboard financeiro no cockpit
- pagina `/app/financeiro`
- pagina `/app/faturamento`

## Pendencias
- consultas agregadas reais
- export CSV real
- base para PDF
- fechamento de caixa conectado ao banco
