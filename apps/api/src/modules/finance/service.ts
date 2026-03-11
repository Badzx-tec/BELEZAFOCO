import { Prisma } from "@prisma/client";
import { endOfMonth, isBefore, startOfMonth, subMonths } from "date-fns";
import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";

type DbClient = Prisma.TransactionClient | typeof prisma | any;
type FinanceDirection = "inflow" | "outflow";
type FinanceEntryKind = "appointment_receivable" | "manual_receivable" | "manual_expense" | "commission" | "adjustment" | "payout";
type FinanceEntryStatus = "pending" | "paid" | "cancelled" | "overdue";

const financeDb = prisma as any;

const defaultCategories = [
  { name: "Agenda e procedimentos", direction: "inflow" as const, colorHex: "#c26b36" },
  { name: "Receitas avulsas", direction: "inflow" as const, colorHex: "#f59e0b" },
  { name: "Produtos e varejo", direction: "inflow" as const, colorHex: "#0f766e" },
  { name: "Operacao e insumos", direction: "outflow" as const, colorHex: "#475569" },
  { name: "Equipe e comissoes", direction: "outflow" as const, colorHex: "#8b5cf6" },
  { name: "Marketing e aquisicao", direction: "outflow" as const, colorHex: "#db2777" }
] satisfies Array<{ name: string; direction: FinanceDirection; colorHex: string }>;

const defaultCostCenters = ["Operacao", "Equipe", "Marketing", "Recepcao", "Financeiro"];

function sumAmounts(
  entries: Array<{ direction: FinanceDirection; amountCents: number; status: FinanceEntryStatus }>,
  direction: FinanceDirection,
  statuses: FinanceEntryStatus[]
) {
  return entries
    .filter((entry) => entry.direction === direction && statuses.includes(entry.status))
    .reduce((total, entry) => total + entry.amountCents, 0);
}

function serializeEntry(entry: any) {
  return {
    id: entry.id,
    entryKey: entry.entryKey,
    title: entry.title,
    description: entry.description,
    direction: entry.direction,
    kind: entry.kind,
    status: entry.status,
    amountCents: entry.amountCents,
    dueDate: entry.dueDate?.toISOString() ?? null,
    occurredAt: entry.occurredAt.toISOString(),
    paidAt: entry.paidAt?.toISOString() ?? null,
    metadata: entry.metadata ?? null,
    category: entry.category
      ? {
          id: entry.category.id,
          name: entry.category.name,
          direction: entry.category.direction,
          colorHex: entry.category.colorHex
        }
      : null,
    costCenter: entry.costCenter
      ? {
          id: entry.costCenter.id,
          name: entry.costCenter.name
        }
      : null,
    staffMember: entry.staffMember
      ? {
          id: entry.staffMember.id,
          name: entry.staffMember.name,
          colorHex: entry.staffMember.colorHex
        }
      : null,
    appointment: entry.appointment
      ? {
          id: entry.appointment.id,
          status: entry.appointment.status,
          startAt: entry.appointment.startAt.toISOString(),
          clientName: entry.appointment.client?.name ?? null,
          serviceName: entry.appointment.service?.name ?? null
        }
      : null,
    payment: entry.payment
      ? {
          id: entry.payment.id,
          provider: entry.payment.provider,
          status: entry.payment.status,
          externalId: entry.payment.externalId,
          confirmedAt: entry.payment.confirmedAt?.toISOString() ?? null
        }
      : null
  };
}

export async function ensureFinanceCatalog(db: DbClient, workspaceId: string) {
  await db.financialCategory.createMany({
    data: defaultCategories.map((item) => ({
      workspaceId,
      ...item
    })),
    skipDuplicates: true
  });

  await db.costCenter.createMany({
    data: defaultCostCenters.map((name) => ({
      workspaceId,
      name
    })),
    skipDuplicates: true
  });

  const [categories, costCenters] = await Promise.all([
    db.financialCategory.findMany({
      where: { workspaceId, active: true },
      orderBy: [{ direction: "asc" }, { name: "asc" }]
    }),
    db.costCenter.findMany({
      where: { workspaceId, active: true },
      orderBy: { name: "asc" }
    })
  ]);

  return { categories, costCenters };
}

async function resolveDefaultFinancialContext(db: DbClient, workspaceId: string, direction: FinanceDirection) {
  const { categories, costCenters } = await ensureFinanceCatalog(db, workspaceId);
  const category =
    categories.find((item: any) => item.direction === direction && item.name === (direction === "inflow" ? "Agenda e procedimentos" : "Operacao e insumos")) ??
    categories.find((item: any) => item.direction === direction) ??
    null;
  const costCenter = costCenters.find((item: any) => item.name === "Operacao") ?? costCenters[0] ?? null;
  return { category, costCenter, categories, costCenters };
}

function resolveAppointmentEntryStatus(input: {
  appointmentStatus: string;
  depositStatus: string | null;
  dueDate: Date;
  paymentStatus: string | null;
}) {
  if (input.paymentStatus === "paid" || input.depositStatus === "paid") {
    return "paid" satisfies FinanceEntryStatus;
  }

  if (input.appointmentStatus === "cancelled" || input.appointmentStatus === "late_cancel") {
    return "cancelled" satisfies FinanceEntryStatus;
  }

  if (isBefore(input.dueDate, new Date())) {
    return "overdue" satisfies FinanceEntryStatus;
  }

  return "pending" satisfies FinanceEntryStatus;
}

export async function syncAppointmentFinancialEntry(db: DbClient, appointmentId: string) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: true,
      service: true,
      staffMember: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!appointment) {
    return null;
  }

  const amountCents = appointment.depositAmount ?? appointment.service.priceValue ?? 0;
  if (!amountCents) {
    return null;
  }

  const { category, costCenter } = await resolveDefaultFinancialContext(db, appointment.workspaceId, "inflow");
  const payment = appointment.payments[0] ?? null;
  const status = resolveAppointmentEntryStatus({
    appointmentStatus: appointment.status,
    depositStatus: appointment.depositStatus,
    dueDate: appointment.startAt,
    paymentStatus: payment?.status ?? null
  });

  const entry = await db.financialEntry.upsert({
    where: { entryKey: `appointment:${appointment.id}:receivable` },
    update: {
      workspaceId: appointment.workspaceId,
      categoryId: category?.id ?? null,
      costCenterId: costCenter?.id ?? null,
      appointmentId: appointment.id,
      paymentId: payment?.id ?? null,
      staffMemberId: appointment.staffMemberId,
      title: `${appointment.service.name} · ${appointment.client.name}`,
      description: appointment.publicNotes ?? appointment.internalNotes ?? null,
      direction: "inflow",
      kind: "appointment_receivable",
      status,
      amountCents,
      dueDate: appointment.startAt,
      occurredAt: appointment.createdAt,
      paidAt: status === "paid" ? payment?.confirmedAt ?? appointment.confirmedAt ?? new Date() : null,
      metadata: {
        appointmentStatus: appointment.status,
        depositStatus: appointment.depositStatus,
        serviceName: appointment.service.name,
        clientName: appointment.client.name,
        staffName: appointment.staffMember.name,
        source: appointment.source
      }
    },
    create: {
      workspaceId: appointment.workspaceId,
      categoryId: category?.id ?? null,
      costCenterId: costCenter?.id ?? null,
      appointmentId: appointment.id,
      paymentId: payment?.id ?? null,
      staffMemberId: appointment.staffMemberId,
      entryKey: `appointment:${appointment.id}:receivable`,
      title: `${appointment.service.name} · ${appointment.client.name}`,
      description: appointment.publicNotes ?? appointment.internalNotes ?? null,
      direction: "inflow",
      kind: "appointment_receivable",
      status,
      amountCents,
      dueDate: appointment.startAt,
      occurredAt: appointment.createdAt,
      paidAt: status === "paid" ? payment?.confirmedAt ?? appointment.confirmedAt ?? new Date() : null,
      metadata: {
        appointmentStatus: appointment.status,
        depositStatus: appointment.depositStatus,
        serviceName: appointment.service.name,
        clientName: appointment.client.name,
        staffName: appointment.staffMember.name,
        source: appointment.source
      }
    }
  });

  return entry;
}

export async function createManualFinancialEntry(
  db: DbClient,
  input: {
    workspaceId: string;
    createdByUserId?: string;
    title: string;
    description?: string | null;
    direction: FinanceDirection;
    kind: Exclude<FinanceEntryKind, "appointment_receivable">;
    amountCents: number;
    occurredAt: Date;
    dueDate?: Date | null;
    paidAt?: Date | null;
    categoryId?: string | null;
    costCenterId?: string | null;
    staffMemberId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }
) {
  const { category, costCenter } = await resolveDefaultFinancialContext(db, input.workspaceId, input.direction);
  return db.financialEntry.create({
    data: {
      workspaceId: input.workspaceId,
      createdByUserId: input.createdByUserId,
      staffMemberId: input.staffMemberId ?? null,
      categoryId: input.categoryId ?? category?.id ?? null,
      costCenterId: input.costCenterId ?? costCenter?.id ?? null,
      entryKey: `manual:${input.workspaceId}:${randomUUID()}`,
      title: input.title,
      description: input.description ?? null,
      direction: input.direction,
      kind: input.kind,
      status: input.paidAt ? "paid" : input.dueDate && isBefore(input.dueDate, new Date()) ? "overdue" : "pending",
      amountCents: input.amountCents,
      dueDate: input.dueDate ?? null,
      occurredAt: input.occurredAt,
      paidAt: input.paidAt ?? null,
      metadata: input.metadata ?? Prisma.JsonNull
    }
  });
}

export async function buildFinanceDashboard(workspaceId: string) {
  const catalog = await ensureFinanceCatalog(financeDb, workspaceId);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const sixMonthStarts = Array.from({ length: 6 }, (_, index) => startOfMonth(subMonths(now, 5 - index)));

  const [entries, recentClosures, recentAppointments] = await Promise.all([
    financeDb.financialEntry.findMany({
      where: {
        workspaceId,
        OR: [
          { occurredAt: { gte: sixMonthStarts[0] } },
          { dueDate: { gte: sixMonthStarts[0] } }
        ]
      },
      include: {
        category: true,
        costCenter: true,
        appointment: {
          include: {
            client: true,
            service: true
          }
        },
        payment: true,
        staffMember: true
      },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }]
    }),
    financeDb.cashClosure.findMany({
      where: { workspaceId },
      orderBy: { closedAt: "desc" },
      take: 4,
      include: {
        closedByUser: {
          select: { id: true, name: true }
        }
      }
    }),
    financeDb.appointment.findMany({
      where: {
        workspaceId,
        startAt: { gte: monthStart, lte: monthEnd },
        status: { in: ["confirmed", "done", "pending_payment"] }
      },
      include: {
        service: true,
        staffMember: true
      }
    })
  ]);

  const monthEntries = entries.filter((entry: any) => entry.occurredAt >= monthStart && entry.occurredAt <= monthEnd);
  const receivedCents = sumAmounts(monthEntries, "inflow", ["paid"]);
  const pendingReceivablesCents = sumAmounts(monthEntries, "inflow", ["pending", "overdue"]);
  const paidOutflowCents = sumAmounts(monthEntries, "outflow", ["paid"]);
  const scheduledOutflowCents = sumAmounts(monthEntries, "outflow", ["pending", "overdue"]);
  const overdueEntries = entries.filter((entry: any) => entry.status === "overdue");
  const projectedNetCents = receivedCents + pendingReceivablesCents - (paidOutflowCents + scheduledOutflowCents);

  const categoryMap = new Map<string, { id: string; name: string; direction: FinanceDirection; amountCents: number; colorHex: string }>();
  for (const entry of monthEntries) {
    const key = entry.category?.id ?? `${entry.direction}:uncategorized`;
    const current = categoryMap.get(key);
    const signedAmount = entry.direction === "inflow" ? entry.amountCents : -entry.amountCents;
    if (current) {
      current.amountCents += signedAmount;
      continue;
    }
    categoryMap.set(key, {
      id: entry.category?.id ?? key,
      name: entry.category?.name ?? (entry.direction === "inflow" ? "Receitas sem categoria" : "Despesas sem categoria"),
      direction: entry.direction,
      amountCents: signedAmount,
      colorHex: entry.category?.colorHex ?? (entry.direction === "inflow" ? "#c26b36" : "#475569")
    });
  }

  const staffMap = new Map<string, { id: string; name: string; colorHex: string; revenueCents: number; appointments: number; projectedCommissionCents: number }>();
  for (const item of recentAppointments) {
    const amount = item.service.priceValue ?? item.depositAmount ?? 0;
    const commission = Math.round((amount * item.staffMember.commissionPercent) / 100);
    const current = staffMap.get(item.staffMemberId);
    if (current) {
      current.revenueCents += amount;
      current.projectedCommissionCents += commission;
      current.appointments += 1;
      continue;
    }
    staffMap.set(item.staffMemberId, {
      id: item.staffMemberId,
      name: item.staffMember.name,
      colorHex: item.staffMember.colorHex,
      revenueCents: amount,
      appointments: 1,
      projectedCommissionCents: commission
    });
  }

  const monthlyTrend = sixMonthStarts.map((monthDate) => {
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const monthEndDate = endOfMonth(monthDate);
    const monthItems = entries.filter((entry: any) => entry.occurredAt >= monthDate && entry.occurredAt <= monthEndDate);
    return {
      month: monthKey,
      inflowCents: sumAmounts(monthItems, "inflow", ["paid", "pending", "overdue"]),
      outflowCents: sumAmounts(monthItems, "outflow", ["paid", "pending", "overdue"])
    };
  });

  return {
    summary: {
      receivedCents,
      pendingReceivablesCents,
      paidOutflowCents,
      scheduledOutflowCents,
      projectedNetCents,
      overdueCount: overdueEntries.length
    },
    spotlight: {
      monthLabel: monthStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      nextClosureAt: recentClosures[0]?.closedAt.toISOString() ?? null
    },
    recentEntries: monthEntries.slice(0, 8).map(serializeEntry),
    categoryBreakdown: Array.from(categoryMap.values()).sort((a, b) => Math.abs(b.amountCents) - Math.abs(a.amountCents)).slice(0, 6),
    staffPerformance: Array.from(staffMap.values()).sort((a, b) => b.revenueCents - a.revenueCents).slice(0, 5),
    trend: monthlyTrend,
    closures: recentClosures.map((closure: any) => ({
      id: closure.id,
      openedAt: closure.openedAt.toISOString(),
      closedAt: closure.closedAt.toISOString(),
      inflowCents: closure.inflowCents,
      outflowCents: closure.outflowCents,
      expectedBalanceCents: closure.expectedBalanceCents,
      actualBalanceCents: closure.actualBalanceCents,
      notes: closure.notes,
      closedByUser: closure.closedByUser ? { id: closure.closedByUser.id, name: closure.closedByUser.name } : null
    })),
    catalog: {
      categories: catalog.categories.map((item: any) => ({
        id: item.id,
        name: item.name,
        direction: item.direction,
        colorHex: item.colorHex
      })),
      costCenters: catalog.costCenters.map((item: any) => ({
        id: item.id,
        name: item.name
      }))
    }
  };
}

export async function buildCommissionSummary(workspaceId: string, from?: Date, to?: Date) {
  const range = {
    gte: from ?? startOfMonth(new Date()),
    lte: to ?? endOfMonth(new Date())
  };

  const appointments = await financeDb.appointment.findMany({
    where: {
      workspaceId,
      startAt: range,
      status: { in: ["confirmed", "done", "pending_payment"] }
    },
    include: {
      service: true,
      staffMember: true
    },
    orderBy: { startAt: "asc" }
  });

  const byStaff = new Map<string, { id: string; name: string; colorHex: string; appointments: number; revenueCents: number; commissionPercent: number; projectedCommissionCents: number }>();
  for (const appointment of appointments) {
    const amount = appointment.service.priceValue ?? appointment.depositAmount ?? 0;
    const projectedCommissionCents = Math.round((amount * appointment.staffMember.commissionPercent) / 100);
    const current = byStaff.get(appointment.staffMemberId);
    if (current) {
      current.appointments += 1;
      current.revenueCents += amount;
      current.projectedCommissionCents += projectedCommissionCents;
      continue;
    }
    byStaff.set(appointment.staffMemberId, {
      id: appointment.staffMemberId,
      name: appointment.staffMember.name,
      colorHex: appointment.staffMember.colorHex,
      appointments: 1,
      revenueCents: amount,
      commissionPercent: appointment.staffMember.commissionPercent,
      projectedCommissionCents
    });
  }

  const staff = Array.from(byStaff.values()).sort((a, b) => b.projectedCommissionCents - a.projectedCommissionCents);
  return {
    range: {
      from: range.gte.toISOString(),
      to: range.lte.toISOString()
    },
    totals: {
      appointments: appointments.length,
      revenueCents: staff.reduce((total, item) => total + item.revenueCents, 0),
      projectedCommissionCents: staff.reduce((total, item) => total + item.projectedCommissionCents, 0)
    },
    staff
  };
}

export async function createCashClosure(input: {
  workspaceId: string;
  closedByUserId?: string;
  openedAt: Date;
  closedAt: Date;
  actualBalanceCents?: number | null;
  notes?: string | null;
}) {
  const paidEntries = await financeDb.financialEntry.findMany({
    where: {
      workspaceId: input.workspaceId,
      status: "paid",
      OR: [
        { paidAt: { gte: input.openedAt, lte: input.closedAt } },
        {
          paidAt: null,
          occurredAt: { gte: input.openedAt, lte: input.closedAt }
        }
      ]
    }
  });

  const inflowCents = sumAmounts(paidEntries, "inflow", ["paid"]);
  const outflowCents = sumAmounts(paidEntries, "outflow", ["paid"]);
  return financeDb.cashClosure.create({
    data: {
      workspaceId: input.workspaceId,
      closedByUserId: input.closedByUserId,
      openedAt: input.openedAt,
      closedAt: input.closedAt,
      inflowCents,
      outflowCents,
      expectedBalanceCents: inflowCents - outflowCents,
      actualBalanceCents: input.actualBalanceCents ?? null,
      notes: input.notes ?? null
    }
  });
}

export async function listFinancialEntries(input: {
  workspaceId: string;
  direction?: FinanceDirection;
  status?: FinanceEntryStatus;
  kind?: FinanceEntryKind;
}) {
  return financeDb.financialEntry.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.direction ? { direction: input.direction } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.kind ? { kind: input.kind } : {})
    },
    include: {
      category: true,
      costCenter: true,
      appointment: {
        include: {
          client: true,
          service: true
        }
      },
      payment: true,
      staffMember: true
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }]
  });
}

export { serializeEntry };
