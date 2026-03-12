# 04. Domain Model

## Identidade
- `User`
- `Account`
- `Session`
- `PasswordCredential`
- `OAuthProviderLink`

## Tenant
- `Workspace`
- `Membership`
- `Role`
- `BusinessProfile`
- `WorkspaceSubscription`
- `FeatureLimit`

## Agenda e booking
- `ServiceCategory`
- `Service`
- `StaffProfile`
- `Client`
- `Appointment`
- `AvailabilityRule`
- `AvailabilityException`
- `ReminderJob`

## Financeiro
- `Payment`
- `PaymentAttempt`
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

## Operacao
- `AuditLog`
- `NotificationLog`
- `FileAsset`

## Regras principais
- Todo agregado transacional carrega `workspaceId`.
- `Appointment` suporta `pending_payment` com `paymentExpiresAt`.
- `LedgerEntry` e imutavel; correcoes entram por `adjustment`.
- `PaymentAttempt` guarda `idempotencyKey`, request e response.
- `NotificationLog` cobre email, WhatsApp e sistema.
- `FileAsset` cobre logo, avatar, documento e imagem.
