CREATE TYPE "FinancialDirection" AS ENUM ('inflow', 'outflow');
CREATE TYPE "FinancialEntryKind" AS ENUM ('appointment_receivable', 'manual_receivable', 'manual_expense', 'commission', 'adjustment', 'payout');
CREATE TYPE "FinancialEntryStatus" AS ENUM ('pending', 'paid', 'cancelled', 'overdue');

CREATE TABLE "FinancialCategory" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "direction" "FinancialDirection" NOT NULL,
  "colorHex" TEXT NOT NULL DEFAULT '#c26b36',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FinancialCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CostCenter" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinancialEntry" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "categoryId" TEXT,
  "costCenterId" TEXT,
  "appointmentId" TEXT,
  "paymentId" TEXT,
  "staffMemberId" TEXT,
  "createdByUserId" TEXT,
  "entryKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "direction" "FinancialDirection" NOT NULL,
  "kind" "FinancialEntryKind" NOT NULL,
  "status" "FinancialEntryStatus" NOT NULL DEFAULT 'pending',
  "amountCents" INTEGER NOT NULL,
  "dueDate" TIMESTAMP(3),
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FinancialEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashClosure" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "closedByUserId" TEXT,
  "openedAt" TIMESTAMP(3) NOT NULL,
  "closedAt" TIMESTAMP(3) NOT NULL,
  "inflowCents" INTEGER NOT NULL,
  "outflowCents" INTEGER NOT NULL,
  "expectedBalanceCents" INTEGER NOT NULL,
  "actualBalanceCents" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CashClosure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinancialCategory_workspaceId_name_direction_key" ON "FinancialCategory"("workspaceId", "name", "direction");
CREATE INDEX "FinancialCategory_workspaceId_direction_active_idx" ON "FinancialCategory"("workspaceId", "direction", "active");

CREATE UNIQUE INDEX "CostCenter_workspaceId_name_key" ON "CostCenter"("workspaceId", "name");
CREATE INDEX "CostCenter_workspaceId_active_idx" ON "CostCenter"("workspaceId", "active");

CREATE UNIQUE INDEX "FinancialEntry_entryKey_key" ON "FinancialEntry"("entryKey");
CREATE INDEX "FinancialEntry_workspaceId_direction_status_dueDate_idx" ON "FinancialEntry"("workspaceId", "direction", "status", "dueDate");
CREATE INDEX "FinancialEntry_workspaceId_occurredAt_idx" ON "FinancialEntry"("workspaceId", "occurredAt");
CREATE INDEX "FinancialEntry_appointmentId_kind_idx" ON "FinancialEntry"("appointmentId", "kind");
CREATE INDEX "FinancialEntry_paymentId_status_idx" ON "FinancialEntry"("paymentId", "status");
CREATE INDEX "FinancialEntry_staffMemberId_kind_status_idx" ON "FinancialEntry"("staffMemberId", "kind", "status");

CREATE INDEX "CashClosure_workspaceId_closedAt_idx" ON "CashClosure"("workspaceId", "closedAt");

ALTER TABLE "FinancialCategory"
  ADD CONSTRAINT "FinancialCategory_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CostCenter"
  ADD CONSTRAINT "CostCenter_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FinancialEntry"
  ADD CONSTRAINT "FinancialEntry_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FinancialEntry"
  ADD CONSTRAINT "FinancialEntry_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialEntry"
  ADD CONSTRAINT "FinancialEntry_costCenterId_fkey"
  FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialEntry"
  ADD CONSTRAINT "FinancialEntry_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialEntry"
  ADD CONSTRAINT "FinancialEntry_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialEntry"
  ADD CONSTRAINT "FinancialEntry_staffMemberId_fkey"
  FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialEntry"
  ADD CONSTRAINT "FinancialEntry_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashClosure"
  ADD CONSTRAINT "CashClosure_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CashClosure"
  ADD CONSTRAINT "CashClosure_closedByUserId_fkey"
  FOREIGN KEY ("closedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
