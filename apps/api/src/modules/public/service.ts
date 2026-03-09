import { Prisma } from "@prisma/client";
import { addDays, addMinutes, isAfter } from "date-fns";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { enforcePlan } from "../../lib/plan.js";
import { generateSlots, intersectWindows, type AppointmentIntervalInput } from "../../lib/scheduler.js";
import { endOfZonedDay, startOfZonedDay, zonedDateKey, zonedDateTime, zonedWeekday } from "../../lib/timezone.js";
import { MercadoPagoProvider } from "../payments/provider.js";

type DbClient = Prisma.TransactionClient | typeof prisma;

const ACTIVE_APPOINTMENT_STATUSES = ["requested", "pending_payment", "confirmed", "done", "no_show"] as const;

type WorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  address: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  description: string | null;
  bookingPolicy: string | null;
  brandPrimaryColor: string;
  brandAccentColor: string;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
};

type ServiceRecord = {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  description: string | null;
  durationMinutes: number;
  prepMinutes: number;
  finishingMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  priceType: string;
  priceValue: number | null;
  depositEnabled: boolean;
  depositType: string | null;
  depositValue: number | null;
  requiredResourceId: string | null;
  featured: boolean;
  onlineBookingEnabled: boolean;
};

type StaffRecord = {
  id: string;
  workspaceId: string;
  name: string;
  bio: string | null;
  contact: string | null;
  colorHex: string;
  commissionPercent: number;
  active: boolean;
  staffServices: Array<{ serviceId: string }>;
  availabilities: Array<{ weekday: number; startTime: string; endTime: string }>;
  exceptions: Array<{ startAt: Date; endAt: Date; reason: string | null }>;
};

function calculateDepositAmount(service: ServiceRecord) {
  if (!service.depositEnabled) return null;
  if (service.depositType === "percent") {
    return Math.floor(((service.priceValue ?? 0) * (service.depositValue ?? 0)) / 100);
  }
  return service.depositValue ?? 0;
}

function getServiceInterval(item: ServiceRecord | { durationMinutes: number; prepMinutes?: number | null; finishingMinutes?: number | null; bufferBeforeMinutes?: number | null; bufferAfterMinutes?: number | null; }) {
  return {
    durationMinutes: item.durationMinutes,
    prepMinutes: item.prepMinutes ?? 0,
    finishingMinutes: item.finishingMinutes ?? 0,
    bufferBeforeMinutes: item.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: item.bufferAfterMinutes ?? 0
  };
}

function buildBusinessWindows(businessHours: Array<{ startTime: string; endTime: string }>, date: string, timeZone: string) {
  return businessHours
    .map((item) => ({
      startAt: zonedDateTime(date, item.startTime, timeZone),
      endAt: zonedDateTime(date, item.endTime, timeZone)
    }))
    .filter((item) => item.startAt < item.endAt);
}

function buildAvailabilityWindows(availabilities: Array<{ startTime: string; endTime: string }>, date: string, timeZone: string) {
  return availabilities
    .map((item) => ({
      startAt: zonedDateTime(date, item.startTime, timeZone),
      endAt: zonedDateTime(date, item.endTime, timeZone)
    }))
    .filter((item) => item.startAt < item.endAt);
}

async function getWorkspaceBySlug(db: DbClient, slug: string) {
  return db.workspace.findUniqueOrThrow({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      address: true,
      whatsapp: true,
      logoUrl: true,
      description: true,
      bookingPolicy: true,
      brandPrimaryColor: true,
      brandAccentColor: true,
      minAdvanceMinutes: true,
      maxAdvanceDays: true
    }
  }) as Promise<WorkspaceRecord>;
}

async function getServiceForWorkspace(db: DbClient, workspaceId: string, serviceId: string) {
  return db.service.findFirstOrThrow({
    where: { id: serviceId, workspaceId, active: true, onlineBookingEnabled: true },
    select: {
      id: true,
      workspaceId: true,
      name: true,
      category: true,
      description: true,
      durationMinutes: true,
      prepMinutes: true,
      finishingMinutes: true,
      bufferBeforeMinutes: true,
      bufferAfterMinutes: true,
      priceType: true,
      priceValue: true,
      depositEnabled: true,
      depositType: true,
      depositValue: true,
      requiredResourceId: true,
      featured: true,
      onlineBookingEnabled: true
    }
  }) as Promise<ServiceRecord>;
}

async function getEligibleStaff(db: DbClient, workspaceId: string, serviceId: string, weekday: number, dayStart: Date, dayEnd: Date, staffMemberId?: string) {
  return db.staffMember.findMany({
    where: {
      workspaceId,
      active: true,
      ...(staffMemberId ? { id: staffMemberId } : {}),
      staffServices: { some: { serviceId } }
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      workspaceId: true,
      name: true,
      bio: true,
      contact: true,
      colorHex: true,
      commissionPercent: true,
      active: true,
      staffServices: { select: { serviceId: true } },
      availabilities: { where: { weekday }, select: { weekday: true, startTime: true, endTime: true } },
      exceptions: { where: { startAt: { lt: dayEnd }, endAt: { gt: dayStart } }, select: { startAt: true, endAt: true, reason: true } }
    }
  }) as Promise<StaffRecord[]>;
}

async function getSharedBlocks(db: DbClient, workspaceId: string, dayStart: Date, dayEnd: Date, staffMemberId: string, resourceId?: string | null) {
  const blocks = await db.calendarBlock.findMany({
    where: {
      workspaceId,
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
      OR: [
        { scope: "workspace" },
        { scope: "staff", staffMemberId },
        ...(resourceId ? [{ scope: "resource", resourceId }] : [])
      ]
    },
    select: { startAt: true, endAt: true }
  });

  return blocks;
}

async function getExistingAppointments(db: DbClient, workspaceId: string, dayStart: Date, dayEnd: Date, staffMemberId: string, resourceId?: string | null) {
  return db.appointment.findMany({
    where: {
      workspaceId,
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      OR: [
        { staffMemberId },
        ...(resourceId ? [{ resourceId }] : [])
      ]
    },
    select: {
      startAt: true,
      endAt: true,
      service: {
        select: {
          durationMinutes: true,
          prepMinutes: true,
          finishingMinutes: true,
          bufferBeforeMinutes: true,
          bufferAfterMinutes: true
        }
      }
    }
  });
}

async function getDailySlotState(db: DbClient, workspace: WorkspaceRecord, service: ServiceRecord, staffMemberId: string, date: string) {
  const dayStart = startOfZonedDay(date, workspace.timezone);
  const dayEnd = endOfZonedDay(date, workspace.timezone);
  const weekday = zonedWeekday(dayStart, workspace.timezone);

  const [businessHours, staffMembers] = await Promise.all([
    db.businessHour.findMany({
      where: { workspaceId: workspace.id, weekday },
      orderBy: { startTime: "asc" },
      select: { startTime: true, endTime: true }
    }),
    getEligibleStaff(db, workspace.id, service.id, weekday, dayStart, dayEnd, staffMemberId)
  ]);

  if (!staffMembers.length) {
    return { staff: null, slots: [] as Date[] };
  }

  const staff = staffMembers[0];
  const workspaceWindows = buildBusinessWindows(businessHours, date, workspace.timezone);
  const availabilityWindows = buildAvailabilityWindows(staff.availabilities, date, workspace.timezone);
  const windows = intersectWindows(workspaceWindows, availabilityWindows);

  if (!windows.length) {
    return { staff, slots: [] as Date[] };
  }

  const [appointments, blocks] = await Promise.all([
    getExistingAppointments(db, workspace.id, dayStart, dayEnd, staff.id, service.requiredResourceId),
    getSharedBlocks(db, workspace.id, dayStart, dayEnd, staff.id, service.requiredResourceId)
  ]);

  const existing: AppointmentIntervalInput[] = [
    ...appointments.map((item) => ({
      startAt: item.startAt,
      endAt: item.endAt,
      ...getServiceInterval(item.service)
    })),
    ...staff.exceptions.map((item) => ({ startAt: item.startAt, endAt: item.endAt }))
  ];

  const minStartAt = addMinutes(new Date(), workspace.minAdvanceMinutes);
  const maxDate = addDays(new Date(), workspace.maxAdvanceDays);
  const requestedDay = startOfZonedDay(date, workspace.timezone);

  if (isAfter(requestedDay, maxDate)) {
    return { staff, slots: [] as Date[] };
  }

  const slots = generateSlots({
    windows,
    existing,
    blocked: blocks,
    minStartAt,
    stepMinutes: 15,
    ...getServiceInterval(service)
  });

  return { staff, slots };
}

export async function getPublicWorkspaceData(slug: string) {
  const workspace = await getWorkspaceBySlug(prisma, slug);
  const [services, staffMembers, businessHours] = await Promise.all([
    prisma.service.findMany({
      where: { workspaceId: workspace.id, active: true, onlineBookingEnabled: true },
      orderBy: [{ featured: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        durationMinutes: true,
        prepMinutes: true,
        finishingMinutes: true,
        priceType: true,
        priceValue: true,
        depositEnabled: true,
        depositType: true,
        depositValue: true,
        featured: true
      }
    }),
    prisma.staffMember.findMany({
      where: { workspaceId: workspace.id, active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        bio: true,
        colorHex: true,
        staffServices: { select: { serviceId: true } }
      }
    }),
    prisma.businessHour.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
      select: { weekday: true, startTime: true, endTime: true }
    })
  ]);

  return {
    workspace,
    businessHours,
    services: services.map((service) => ({
      ...service,
      depositAmount: calculateDepositAmount(service as ServiceRecord)
    })),
    staffMembers: staffMembers.map((staff) => ({
      ...staff,
      serviceIds: staff.staffServices.map((item) => item.serviceId)
    }))
  };
}

export async function getPublicSlots(input: { slug: string; serviceId: string; date: string; staffMemberId?: string }) {
  const workspace = await getWorkspaceBySlug(prisma, input.slug);
  const service = await getServiceForWorkspace(prisma, workspace.id, input.serviceId);

  if (input.staffMemberId) {
    const state = await getDailySlotState(prisma, workspace, service, input.staffMemberId, input.date);
    return {
      date: input.date,
      staff: state.staff ? [{ id: state.staff.id, name: state.staff.name, colorHex: state.staff.colorHex }] : [],
      slots: state.slots.map((slot) => ({
        staffMemberId: state.staff?.id ?? input.staffMemberId,
        startAt: slot.toISOString()
      }))
    };
  }

  const dayStart = startOfZonedDay(input.date, workspace.timezone);
  const dayEnd = endOfZonedDay(input.date, workspace.timezone);
  const weekday = zonedWeekday(dayStart, workspace.timezone);
  const staffMembers = await getEligibleStaff(prisma, workspace.id, service.id, weekday, dayStart, dayEnd);
  const staffStates = await Promise.all(
    staffMembers.map(async (staff) => {
      const state = await getDailySlotState(prisma, workspace, service, staff.id, input.date);
      return {
        staff,
        slots: state.slots
      };
    })
  );

  return {
    date: input.date,
    staff: staffStates.map((item) => ({ id: item.staff.id, name: item.staff.name, colorHex: item.staff.colorHex })),
    slots: staffStates
      .flatMap((item) => item.slots.map((slot) => ({ staffMemberId: item.staff.id, startAt: slot.toISOString() })))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  };
}

export async function createPublicBooking(input: {
  slug: string;
  serviceId: string;
  staffMemberId: string;
  startAt: string;
  name: string;
  whatsapp: string;
  email?: string;
  whatsappOptIn: boolean;
  policyAccepted: boolean;
  notes?: string;
  ip: string;
  idempotencyKey?: string;
}) {
  if (!input.policyAccepted) {
    throw new Error("A política de agendamento precisa ser aceita");
  }

  const workspace = await getWorkspaceBySlug(prisma, input.slug);
  const service = await getServiceForWorkspace(prisma, workspace.id, input.serviceId);
  const startAt = new Date(input.startAt);

  return prisma.$transaction(async (tx) => {
    if (input.idempotencyKey) {
      const existing = await tx.appointment.findFirst({
        where: { workspaceId: workspace.id, idempotencyKey: input.idempotencyKey },
        include: { payments: true }
      });
      if (existing) {
        return {
          appointmentId: existing.id,
          status: existing.status,
          payment: existing.payments[0]
            ? {
                externalId: existing.payments[0].externalId,
                qrCode: existing.payments[0].qrCode,
                pixCopyPaste: existing.payments[0].pixCopyPaste,
                expiresAt: existing.payments[0].expiresAt?.toISOString() ?? null
              }
            : null,
          duplicate: true
        };
      }
    }

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`staff:${input.staffMemberId}`}))`;
    if (service.requiredResourceId) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`resource:${service.requiredResourceId}`}))`;
    }

    const slotDate = zonedDateKey(startAt, workspace.timezone);
    const { staff, slots } = await getDailySlotState(tx, workspace, service, input.staffMemberId, slotDate);

    if (!staff || !slots.some((slot) => slot.getTime() === startAt.getTime())) {
      throw new Error("Horário indisponível para este serviço");
    }

    const subscription = await tx.workspaceSubscription.findUniqueOrThrow({ where: { workspaceId: workspace.id } });
    const [staffCount, resourceCount] = await Promise.all([
      tx.staffMember.count({ where: { workspaceId: workspace.id, active: true } }),
      tx.resource.count({ where: { workspaceId: workspace.id, active: true } })
    ]);
    const planGate = enforcePlan(subscription.plan, staffCount, resourceCount, subscription.appointmentsThisMonth + 1);
    if (!planGate.allowed) {
      throw new Error(planGate.reason);
    }

    const client = await tx.client.upsert({
      where: { workspaceId_whatsapp: { workspaceId: workspace.id, whatsapp: input.whatsapp } },
      update: {
        name: input.name,
        email: input.email,
        notes: input.notes,
        whatsappOptInAt: input.whatsappOptIn ? new Date() : null,
        whatsappOptInIp: input.ip,
        whatsappOptInMethod: input.whatsappOptIn ? "public_form" : null
      },
      create: {
        workspaceId: workspace.id,
        name: input.name,
        whatsapp: input.whatsapp,
        email: input.email,
        notes: input.notes,
        whatsappOptInAt: input.whatsappOptIn ? new Date() : null,
        whatsappOptInIp: input.ip,
        whatsappOptInMethod: input.whatsappOptIn ? "public_form" : null
      }
    });

    const depositAmount = calculateDepositAmount(service);
    const status = service.depositEnabled && env.MERCADO_PAGO_ENABLED ? "pending_payment" : "confirmed";
    const paymentExpiresAt = status === "pending_payment" ? addMinutes(new Date(), 30) : null;

    const appointment = await tx.appointment.create({
      data: {
        workspaceId: workspace.id,
        serviceId: service.id,
        staffMemberId: staff.id,
        resourceId: service.requiredResourceId,
        clientId: client.id,
        source: "public_page",
        status,
        startAt,
        endAt: addMinutes(startAt, service.durationMinutes + service.finishingMinutes),
        publicNotes: input.notes,
        depositAmount,
        depositProvider: status === "pending_payment" ? "mercado_pago" : null,
        depositStatus: status === "pending_payment" ? "pending" : null,
        paymentExpiresAt,
        idempotencyKey: input.idempotencyKey,
        cancelToken: randomUUID(),
        confirmedAt: status === "confirmed" ? new Date() : null
      }
    });

    let payment: { externalId: string; qrCode: string; pixCopyPaste: string; expiresAt?: Date | null; idempotencyKey?: string | null } | null = null;

    if (status === "pending_payment" && depositAmount) {
      const provider = new MercadoPagoProvider();
      payment = await provider.createPixCharge({
        amount: depositAmount,
        description: `Sinal ${service.name}`,
        payerName: client.name,
        payerEmail: client.email ?? undefined,
        idempotencyKey: input.idempotencyKey ?? appointment.id
      });

      await tx.payment.create({
        data: {
          appointmentId: appointment.id,
          amount: depositAmount,
          provider: "mercado_pago",
          status: "pending",
          externalId: payment.externalId,
          qrCode: payment.qrCode,
          pixCopyPaste: payment.pixCopyPaste,
          expiresAt: payment.expiresAt ?? paymentExpiresAt,
          idempotencyKey: payment.idempotencyKey ?? input.idempotencyKey ?? appointment.id
        }
      });
    }

    await Promise.all([
      tx.workspaceSubscription.update({
        where: { workspaceId: workspace.id },
        data: { appointmentsThisMonth: { increment: 1 } }
      }),
      tx.auditLog.create({
        data: {
          workspaceId: workspace.id,
          action: "appointment.public_created",
          entityType: "appointment",
          entityId: appointment.id,
          payload: JSON.stringify({
            serviceId: service.id,
            staffMemberId: staff.id,
            startAt: appointment.startAt.toISOString(),
            idempotencyKey: input.idempotencyKey ?? null
          })
        }
      })
    ]);

    return {
      appointmentId: appointment.id,
      status,
      payment: payment
        ? {
            externalId: payment.externalId,
            qrCode: payment.qrCode,
            pixCopyPaste: payment.pixCopyPaste,
            expiresAt: (payment.expiresAt ?? paymentExpiresAt)?.toISOString() ?? null
          }
        : null
    };
  });
}
