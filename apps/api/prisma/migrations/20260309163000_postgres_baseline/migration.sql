-- Create enums
CREATE TYPE "Role" AS ENUM ('owner', 'manager', 'staff', 'receptionist');
CREATE TYPE "PriceType" AS ENUM ('fixed', 'starts_at', 'varies', 'free');
CREATE TYPE "DepositType" AS ENUM ('percent', 'fixed');
CREATE TYPE "AppointmentStatus" AS ENUM ('requested', 'pending_payment', 'confirmed', 'cancelled', 'rescheduled', 'done', 'no_show', 'late_cancel');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE "SubscriptionPlan" AS ENUM ('trial', 'basic', 'pro');
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'cancelled');
CREATE TYPE "AppointmentSource" AS ENUM ('public_page', 'internal_dashboard', 'import');
CREATE TYPE "CalendarBlockScope" AS ENUM ('workspace', 'staff', 'resource');
CREATE TYPE "CalendarBlockType" AS ENUM ('manual_block', 'holiday', 'time_off', 'break');

-- Create tables
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Workspace" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  "address" TEXT,
  "whatsapp" TEXT,
  "logoUrl" TEXT,
  "description" TEXT,
  "bookingPolicy" TEXT,
  "brandPrimaryColor" TEXT NOT NULL DEFAULT '#0f172a',
  "brandAccentColor" TEXT NOT NULL DEFAULT '#d97706',
  "minAdvanceMinutes" INTEGER NOT NULL DEFAULT 120,
  "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
  "freeCancelHours" INTEGER NOT NULL DEFAULT 24,
  "lateCancelFeePercent" INTEGER NOT NULL DEFAULT 0,
  "noShowFeePercent" INTEGER NOT NULL DEFAULT 0,
  "onboardingStep" INTEGER NOT NULL DEFAULT 0,
  "onboardingCompletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessHour" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  CONSTRAINT "BusinessHour_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Resource" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Service" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "durationMinutes" INTEGER NOT NULL,
  "prepMinutes" INTEGER NOT NULL DEFAULT 0,
  "finishingMinutes" INTEGER NOT NULL DEFAULT 0,
  "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
  "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
  "priceType" "PriceType" NOT NULL,
  "priceValue" INTEGER,
  "depositEnabled" BOOLEAN NOT NULL DEFAULT false,
  "depositType" "DepositType",
  "depositValue" INTEGER,
  "requiredResourceId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "onlineBookingEnabled" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffMember" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "bio" TEXT,
  "contact" TEXT,
  "colorHex" TEXT NOT NULL DEFAULT '#1d4ed8',
  "commissionPercent" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffService" (
  "staffMemberId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  CONSTRAINT "StaffService_pkey" PRIMARY KEY ("staffMemberId", "serviceId")
);

CREATE TABLE "StaffAvailability" (
  "id" TEXT NOT NULL,
  "staffMemberId" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  CONSTRAINT "StaffAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffException" (
  "id" TEXT NOT NULL,
  "staffMemberId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  CONSTRAINT "StaffException_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Client" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "email" TEXT,
  "notes" TEXT,
  "whatsappOptInAt" TIMESTAMP(3),
  "whatsappOptInIp" TEXT,
  "whatsappOptInMethod" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "staffMemberId" TEXT NOT NULL,
  "resourceId" TEXT,
  "clientId" TEXT NOT NULL,
  "source" "AppointmentSource" NOT NULL DEFAULT 'public_page',
  "status" "AppointmentStatus" NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "internalNotes" TEXT,
  "publicNotes" TEXT,
  "depositAmount" INTEGER,
  "depositProvider" TEXT,
  "depositStatus" "PaymentStatus",
  "paymentExpiresAt" TIMESTAMP(3),
  "idempotencyKey" TEXT,
  "cancelToken" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "externalId" TEXT,
  "amount" INTEGER NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "qrCode" TEXT,
  "pixCopyPaste" TEXT,
  "idempotencyKey" TEXT,
  "expiresAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "providerPayload" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WaitlistEntry" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "staffMemberId" TEXT,
  "desiredDate" TIMESTAMP(3) NOT NULL,
  "token" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageTemplate" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "templateName" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'pt_BR',
  "body" TEXT NOT NULL,
  CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReminderLog" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "response" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceSubscription" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "plan" "SubscriptionPlan" NOT NULL DEFAULT 'trial',
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
  "paidUntil" TIMESTAMP(3) NOT NULL,
  "trialEndsAt" TIMESTAMP(3),
  "appointmentsThisMonth" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "WorkspaceSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarBlock" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "staffMemberId" TEXT,
  "resourceId" TEXT,
  "scope" "CalendarBlockScope" NOT NULL,
  "type" "CalendarBlockType" NOT NULL DEFAULT 'manual_block',
  "title" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalendarBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- Indexes and unique constraints
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_expiresAt_idx" ON "RefreshToken"("userId", "expiresAt");
CREATE UNIQUE INDEX "Membership_userId_workspaceId_key" ON "Membership"("userId", "workspaceId");
CREATE INDEX "Membership_workspaceId_role_idx" ON "Membership"("workspaceId", "role");
CREATE UNIQUE INDEX "BusinessHour_workspaceId_weekday_startTime_endTime_key" ON "BusinessHour"("workspaceId", "weekday", "startTime", "endTime");
CREATE INDEX "BusinessHour_workspaceId_weekday_idx" ON "BusinessHour"("workspaceId", "weekday");
CREATE INDEX "Resource_workspaceId_active_idx" ON "Resource"("workspaceId", "active");
CREATE INDEX "Service_workspaceId_active_onlineBookingEnabled_displayOrder_idx" ON "Service"("workspaceId", "active", "onlineBookingEnabled", "displayOrder");
CREATE INDEX "StaffMember_workspaceId_active_idx" ON "StaffMember"("workspaceId", "active");
CREATE INDEX "StaffAvailability_staffMemberId_weekday_idx" ON "StaffAvailability"("staffMemberId", "weekday");
CREATE INDEX "StaffException_staffMemberId_startAt_endAt_idx" ON "StaffException"("staffMemberId", "startAt", "endAt");
CREATE UNIQUE INDEX "Client_workspaceId_whatsapp_key" ON "Client"("workspaceId", "whatsapp");
CREATE INDEX "Client_workspaceId_createdAt_idx" ON "Client"("workspaceId", "createdAt");
CREATE UNIQUE INDEX "Appointment_staffMemberId_startAt_key" ON "Appointment"("staffMemberId", "startAt");
CREATE UNIQUE INDEX "Appointment_resourceId_startAt_key" ON "Appointment"("resourceId", "startAt");
CREATE UNIQUE INDEX "Appointment_idempotencyKey_key" ON "Appointment"("idempotencyKey");
CREATE UNIQUE INDEX "Appointment_cancelToken_key" ON "Appointment"("cancelToken");
CREATE INDEX "Appointment_workspaceId_startAt_idx" ON "Appointment"("workspaceId", "startAt");
CREATE INDEX "Appointment_staffMemberId_startAt_endAt_idx" ON "Appointment"("staffMemberId", "startAt", "endAt");
CREATE INDEX "Appointment_resourceId_startAt_endAt_idx" ON "Appointment"("resourceId", "startAt", "endAt");
CREATE INDEX "Appointment_clientId_startAt_idx" ON "Appointment"("clientId", "startAt");
CREATE UNIQUE INDEX "Payment_externalId_key" ON "Payment"("externalId");
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX "Payment_appointmentId_status_idx" ON "Payment"("appointmentId", "status");
CREATE UNIQUE INDEX "WaitlistEntry_token_key" ON "WaitlistEntry"("token");
CREATE INDEX "WaitlistEntry_workspaceId_desiredDate_active_idx" ON "WaitlistEntry"("workspaceId", "desiredDate", "active");
CREATE UNIQUE INDEX "MessageTemplate_workspaceId_type_key" ON "MessageTemplate"("workspaceId", "type");
CREATE UNIQUE INDEX "ReminderLog_appointmentId_type_key" ON "ReminderLog"("appointmentId", "type");
CREATE UNIQUE INDEX "WorkspaceSubscription_workspaceId_key" ON "WorkspaceSubscription"("workspaceId");
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");
CREATE INDEX "CalendarBlock_workspaceId_startAt_endAt_idx" ON "CalendarBlock"("workspaceId", "startAt", "endAt");
CREATE INDEX "CalendarBlock_staffMemberId_startAt_endAt_idx" ON "CalendarBlock"("staffMemberId", "startAt", "endAt");
CREATE INDEX "CalendarBlock_resourceId_startAt_endAt_idx" ON "CalendarBlock"("resourceId", "startAt", "endAt");
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");

-- Foreign keys
ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Membership"
  ADD CONSTRAINT "Membership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership"
  ADD CONSTRAINT "Membership_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessHour"
  ADD CONSTRAINT "BusinessHour_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Resource"
  ADD CONSTRAINT "Resource_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service"
  ADD CONSTRAINT "Service_requiredResourceId_fkey"
  FOREIGN KEY ("requiredResourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StaffMember"
  ADD CONSTRAINT "StaffMember_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffMember"
  ADD CONSTRAINT "StaffMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StaffService"
  ADD CONSTRAINT "StaffService_staffMemberId_fkey"
  FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffService"
  ADD CONSTRAINT "StaffService_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StaffAvailability"
  ADD CONSTRAINT "StaffAvailability_staffMemberId_fkey"
  FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StaffException"
  ADD CONSTRAINT "StaffException_staffMemberId_fkey"
  FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Client"
  ADD CONSTRAINT "Client_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_staffMemberId_fkey"
  FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WaitlistEntry"
  ADD CONSTRAINT "WaitlistEntry_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaitlistEntry"
  ADD CONSTRAINT "WaitlistEntry_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaitlistEntry"
  ADD CONSTRAINT "WaitlistEntry_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MessageTemplate"
  ADD CONSTRAINT "MessageTemplate_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReminderLog"
  ADD CONSTRAINT "ReminderLog_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceSubscription"
  ADD CONSTRAINT "WorkspaceSubscription_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarBlock"
  ADD CONSTRAINT "CalendarBlock_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarBlock"
  ADD CONSTRAINT "CalendarBlock_staffMemberId_fkey"
  FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarBlock"
  ADD CONSTRAINT "CalendarBlock_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
