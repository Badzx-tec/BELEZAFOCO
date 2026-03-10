import { Prisma } from "@prisma/client";
import { addMinutes, differenceInCalendarDays, differenceInMinutes, endOfDay, max as dateMax, min as dateMin, startOfDay } from "date-fns";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { buildFullyBookedResourceRanges, pickResourceUnit } from "./resourceCapacity.js";
import { buildSegments, generateSlots } from "./scheduler.js";

type BookAppointmentInput = {
  workspaceId: string;
  serviceId: string;
  staffMemberId: string;
  clientId: string;
  startAt: Date;
  source: "public" | "admin" | "manual";
  idempotencyKey?: string;
  notesClient?: string;
  notesInternal?: string;
};

export async function getPublicBookingContext(slug: string) {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { slug } });
  const [services, staffMembers] = await Promise.all([
    prisma.service.findMany({
      where: { workspaceId: workspace.id, active: true },
      include: { requiredResource: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }]
    }),
    prisma.staffMember.findMany({
      where: { workspaceId: workspace.id, active: true, isBookable: true },
      include: { staffServices: true },
      orderBy: { name: "asc" }
    })
  ]);

  return { workspace, services, staffMembers };
}

export async function listAvailableSlots(input: {
  workspaceId: string;
  serviceId: string;
  staffMemberId?: string;
  date: Date;
}) {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: input.workspaceId } });
  const service = await prisma.service.findFirstOrThrow({
    where: { id: input.serviceId, workspaceId: input.workspaceId, active: true },
    include: { requiredResource: true }
  });
  const staff = input.staffMemberId
    ? await prisma.staffMember.findFirstOrThrow({
        where: { id: input.staffMemberId, workspaceId: input.workspaceId, active: true, isBookable: true }
      })
    : await prisma.staffMember.findFirstOrThrow({
        where: {
          workspaceId: input.workspaceId,
          active: true,
          isBookable: true,
          staffServices: { some: { serviceId: input.serviceId } }
        }
      });

  const dayStart = startOfDay(input.date);
  const dayEnd = endOfDay(input.date);
  const weekday = input.date.getDay();
  const [businessHour, availabilities, closures, exceptions, staffSegments, resourceSegments] = await Promise.all([
    prisma.businessHour.findUnique({
      where: {
        workspaceId_weekday: {
          workspaceId: input.workspaceId,
          weekday
        }
      }
    }),
    prisma.staffAvailability.findMany({
      where: { staffMemberId: staff.id, weekday },
      orderBy: { startTime: "asc" }
    }),
    prisma.workspaceClosure.findMany({
      where: {
        workspaceId: input.workspaceId,
        startsAt: { lte: dayEnd },
        endsAt: { gte: dayStart }
      }
    }),
    prisma.staffException.findMany({
      where: {
        staffMemberId: staff.id,
        startsAt: { lte: dayEnd },
        endsAt: { gte: dayStart }
      }
    }),
    prisma.appointmentSegment.findMany({
      where: {
        workspaceId: input.workspaceId,
        staffMemberId: staff.id,
        startsAt: { gte: addMinutes(dayStart, -workspace.slotIntervalMinutes), lte: addMinutes(dayEnd, workspace.slotIntervalMinutes) }
      },
      select: {
        startsAt: true
      }
    }),
    service.requiredResourceId
      ? prisma.appointmentSegment.findMany({
          where: {
            workspaceId: input.workspaceId,
            resourceId: service.requiredResourceId,
            startsAt: { gte: addMinutes(dayStart, -workspace.slotIntervalMinutes), lte: addMinutes(dayEnd, workspace.slotIntervalMinutes) }
          },
          select: {
            startsAt: true,
            resourceUnit: true
          }
        })
      : Promise.resolve([])
  ]);

  if (!businessHour || businessHour.isClosed) {
    return { staff, slots: [] };
  }

  const dayBusinessStart = timeOnDate(input.date, businessHour.startTime);
  const dayBusinessEnd = timeOnDate(input.date, businessHour.endTime);
  const fullyBookedResourceRanges =
    service.requiredResourceId && service.requiredResource
      ? buildFullyBookedResourceRanges(resourceSegments, service.requiredResource.capacity, workspace.slotIntervalMinutes)
      : [];
  const existingRanges = [
    ...closures.map((item) => ({ startAt: item.startsAt, endAt: item.endsAt })),
    ...exceptions.map((item) => ({ startAt: item.startsAt, endAt: item.endsAt })),
    ...staffSegments.map((item) => ({
      startAt: item.startsAt,
      endAt: addMinutes(item.startsAt, workspace.slotIntervalMinutes)
    })),
    ...fullyBookedResourceRanges
  ];

  const slots = availabilities.flatMap((availability) => {
    const windowStart = dateMax([dayBusinessStart, timeOnDate(input.date, availability.startTime)]);
    const windowEnd = dateMin([dayBusinessEnd, timeOnDate(input.date, availability.endTime)]);
    if (windowStart >= windowEnd) return [];

    return generateSlots({
      startAt: clampToPolicies(windowStart, workspace.minAdvanceMinutes),
      endAt: windowEnd,
      durationMinutes: service.durationMinutes,
      prepMinutes: service.prepMinutes,
      finishMinutes: service.finishMinutes,
      bufferBeforeMinutes: service.bufferBeforeMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
      slotIntervalMinutes: workspace.slotIntervalMinutes,
      existing: existingRanges
    });
  });

  const filtered = slots.filter((slot) => isInsideBookingWindow(workspace, slot));

  return { staff, slots: uniqueDates(filtered) };
}

export async function createAppointment(input: BookAppointmentInput) {
  const [workspace, service, staffMember, client] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({ where: { id: input.workspaceId } }),
    prisma.service.findFirstOrThrow({
      where: { id: input.serviceId, workspaceId: input.workspaceId, active: true },
      include: { requiredResource: true }
    }),
    prisma.staffMember.findFirstOrThrow({
      where: {
        id: input.staffMemberId,
        workspaceId: input.workspaceId,
        active: true,
        isBookable: true
      },
      include: {
        staffServices: true
      }
    }),
    prisma.client.findFirstOrThrow({ where: { id: input.clientId, workspaceId: input.workspaceId } })
  ]);

  if (!staffMember.staffServices.some((item) => item.serviceId === service.id)) {
    throw new Error("SERVICE_NOT_AVAILABLE_FOR_STAFF");
  }
  if (!isInsideBookingWindow(workspace, input.startAt)) {
    throw new Error("OUTSIDE_BOOKING_WINDOW");
  }

  const { slots } = await listAvailableSlots({
    workspaceId: input.workspaceId,
    serviceId: service.id,
    staffMemberId: staffMember.id,
    date: input.startAt
  });

  if (!slots.some((slot) => slot.getTime() === input.startAt.getTime())) {
    throw new Error("SLOT_NOT_AVAILABLE");
  }

  const endAt = addMinutes(input.startAt, service.durationMinutes);
  const depositAmount = calculateDeposit(service.priceValue ?? 0, service.depositEnabled, service.depositType, service.depositValue);
  const targetStatus = service.depositEnabled && env.MERCADO_PAGO_ENABLED ? "pending_payment" : "confirmed";
  const segments = buildSegments({
    startAt: input.startAt,
    durationMinutes: service.durationMinutes,
    prepMinutes: service.prepMinutes,
    finishMinutes: service.finishMinutes,
    bufferBeforeMinutes: service.bufferBeforeMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes,
    slotIntervalMinutes: workspace.slotIntervalMinutes
  });

  let retries = 0;
  while (retries < 5) {
    try {
      return await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          if (input.idempotencyKey) {
            const existing = await tx.appointment.findUnique({
              where: { idempotencyKey: input.idempotencyKey }
            });

            if (existing) {
              return {
                appointment: existing,
                status: existing.status,
                depositAmount: existing.depositAmount
              };
            }
          }

          let resourceUnit: number | null = null;
          if (service.requiredResourceId && service.requiredResource) {
            const existingResourceSegments = await tx.appointmentSegment.findMany({
              where: {
                workspaceId: input.workspaceId,
                resourceId: service.requiredResourceId,
                startsAt: { in: segments }
              },
              select: {
                startsAt: true,
                resourceUnit: true
              }
            });

            resourceUnit = pickResourceUnit(service.requiredResource.capacity, segments, existingResourceSegments);
            if (!resourceUnit) {
              throw new Error("RESOURCE_CAPACITY_EXHAUSTED");
            }
          }

          const created = await tx.appointment.create({
            data: {
              workspaceId: input.workspaceId,
              serviceId: service.id,
              staffMemberId: staffMember.id,
              resourceId: service.requiredResourceId,
              clientId: client.id,
              source: input.source,
              status: targetStatus,
              startAt: input.startAt,
              endAt,
              priceAmount: service.priceValue,
              depositAmount,
              depositProvider: service.depositEnabled ? "mercado_pago" : null,
              depositStatus: service.depositEnabled ? "pending" : null,
              notesClient: input.notesClient,
              notesInternal: input.notesInternal,
              cancelToken: randomUUID(),
              idempotencyKey: input.idempotencyKey
            }
          });

          await tx.appointmentSegment.createMany({
            data: segments.map((segment) => ({
              appointmentId: created.id,
              workspaceId: input.workspaceId,
              staffMemberId: staffMember.id,
              resourceId: service.requiredResourceId ?? null,
              resourceUnit,
              startsAt: segment
            }))
          });

          await tx.workspaceSubscription.update({
            where: { workspaceId: input.workspaceId },
            data: {
              appointmentsThisMonth: {
                increment: 1
              }
            }
          });

          return {
            appointment: created,
            status: created.status,
            depositAmount: created.depositAmount
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000
        }
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        retries += 1;
        continue;
      }
      if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
        throw new Error("SLOT_CONFLICT");
      }
      if (error instanceof Error && error.message === "RESOURCE_CAPACITY_EXHAUSTED") {
        throw new Error("SLOT_CONFLICT");
      }
      throw error;
    }
  }

  throw new Error("SLOT_CONFLICT");
}

export async function releaseAppointmentCapacity(appointmentId: string) {
  await prisma.appointmentSegment.deleteMany({
    where: { appointmentId }
  });
}

export function calculateDeposit(priceValue: number, depositEnabled: boolean, depositType?: "percent" | "fixed" | null, depositValue?: number | null) {
  if (!depositEnabled) return null;
  if (depositType === "percent") return Math.floor((priceValue * (depositValue ?? 0)) / 100);
  return depositValue ?? 0;
}

function timeOnDate(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const out = new Date(date);
  out.setHours(hours, minutes, 0, 0);
  return out;
}

function clampToPolicies(date: Date, minAdvanceMinutes: number) {
  const minAllowed = addMinutes(new Date(), minAdvanceMinutes);
  return date.getTime() < minAllowed.getTime() ? minAllowed : date;
}

function isInsideBookingWindow(workspace: { minAdvanceMinutes: number; maxAdvanceDays: number }, startAt: Date) {
  return differenceInMinutes(startAt, new Date()) >= workspace.minAdvanceMinutes && differenceInCalendarDays(startAt, new Date()) <= workspace.maxAdvanceDays;
}

function uniqueDates(items: Date[]) {
  const byTime = new Map<number, Date>();
  for (const item of items) byTime.set(item.getTime(), item);
  return [...byTime.values()].sort((a, b) => a.getTime() - b.getTime());
}
