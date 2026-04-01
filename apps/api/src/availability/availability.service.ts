import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type { CreateExceptionDto } from "./dto/create-exception.dto";
import type { CreateRuleDto } from "./dto/create-rule.dto";
import type { QuerySlotsDto } from "./dto/query-slots.dto";

function parseHHMM(hhmm: string, baseDate: Date): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h!, m!, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Rules ──────────────────────────────────────────────────────────────────

  async listRules(workspaceId: string, staffProfileId?: string) {
    return this.prisma.availabilityRule.findMany({
      where: { workspaceId, ...(staffProfileId ? { staffProfileId } : {}) },
      orderBy: [{ staffProfileId: "asc" }, { dayOfWeek: "asc" }]
    });
  }

  async createRule(workspaceId: string, dto: CreateRuleDto) {
    const staff = await this.prisma.staffProfile.findFirst({
      where: { id: dto.staffProfileId, workspaceId }
    });
    if (!staff) throw new NotFoundException("Staff not found");
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException("startTime must be before endTime");
    }
    return this.prisma.availabilityRule.create({
      data: {
        workspaceId,
        staffProfileId: dto.staffProfileId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotIntervalMinutes: dto.slotIntervalMinutes ?? 15,
        capacity: dto.capacity ?? 1
      }
    });
  }

  async deleteRule(workspaceId: string, id: string) {
    const rule = await this.prisma.availabilityRule.findFirst({ where: { id, workspaceId } });
    if (!rule) throw new NotFoundException("Availability rule not found");
    await this.prisma.availabilityRule.delete({ where: { id } });
  }

  // ── Exceptions ─────────────────────────────────────────────────────────────

  async listExceptions(workspaceId: string, staffProfileId?: string) {
    return this.prisma.availabilityException.findMany({
      where: { workspaceId, ...(staffProfileId ? { staffProfileId } : {}) },
      orderBy: { startsAt: "asc" }
    });
  }

  async createException(workspaceId: string, dto: CreateExceptionDto) {
    if (dto.staffProfileId) {
      const staff = await this.prisma.staffProfile.findFirst({
        where: { id: dto.staffProfileId, workspaceId }
      });
      if (!staff) throw new NotFoundException("Staff not found");
    }
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (startsAt >= endsAt) {
      throw new BadRequestException("startsAt must be before endsAt");
    }
    return this.prisma.availabilityException.create({
      data: {
        workspaceId,
        staffProfileId: dto.staffProfileId,
        startsAt,
        endsAt,
        isAvailable: dto.isAvailable ?? false,
        reason: dto.reason
      }
    });
  }

  async deleteException(workspaceId: string, id: string) {
    const ex = await this.prisma.availabilityException.findFirst({ where: { id, workspaceId } });
    if (!ex) throw new NotFoundException("Availability exception not found");
    await this.prisma.availabilityException.delete({ where: { id } });
  }

  // ── Slot calculation ───────────────────────────────────────────────────────

  async getAvailableSlots(workspaceId: string, dto: QuerySlotsDto) {
    const { staffProfileId, serviceId, date } = dto;

    const [year, month, day] = date.split("-").map(Number);
    // Build a UTC-safe base date using the numeric parts
    const baseDate = new Date(year!, month! - 1, day!, 0, 0, 0, 0);
    const dayOfWeek = baseDate.getDay(); // 0=Sun … 6=Sat

    const [staff, service] = await Promise.all([
      this.prisma.staffProfile.findFirst({ where: { id: staffProfileId, workspaceId } }),
      this.prisma.service.findFirst({ where: { id: serviceId, workspaceId } })
    ]);
    if (!staff) throw new NotFoundException("Staff not found");
    if (!service) throw new NotFoundException("Service not found");

    const rules = await this.prisma.availabilityRule.findMany({
      where: { workspaceId, staffProfileId, dayOfWeek }
    });
    if (rules.length === 0) return { date, slots: [] };

    const dayStart = new Date(baseDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(baseDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [exceptions, existingAppointments] = await Promise.all([
      this.prisma.availabilityException.findMany({
        where: {
          workspaceId,
          OR: [{ staffProfileId }, { staffProfileId: null }],
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart }
        }
      }),
      this.prisma.appointment.findMany({
        where: {
          workspaceId,
          staffProfileId,
          status: { in: ["draft", "pending_payment", "confirmed", "checked_in"] },
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart }
        }
      })
    ]);

    const blockedExceptions = exceptions.filter((e) => !e.isAvailable);
    const slotDuration =
      service.bufferBeforeMinutes + service.durationMinutes + service.bufferAfterMinutes;

    const slots: Array<{ startsAt: string; endsAt: string }> = [];

    for (const rule of rules) {
      const ruleStart = parseHHMM(rule.startTime, baseDate);
      const ruleEnd = parseHHMM(rule.endTime, baseDate);
      let cursor = new Date(ruleStart);

      while (cursor < ruleEnd) {
        const slotEnd = addMinutes(cursor, slotDuration);
        if (slotEnd > ruleEnd) break;

        const isBlocked =
          blockedExceptions.some((e) => overlaps(cursor, slotEnd, e.startsAt, e.endsAt)) ||
          existingAppointments.some((a) => overlaps(cursor, slotEnd, a.startsAt, a.endsAt));

        if (!isBlocked) {
          slots.push({ startsAt: cursor.toISOString(), endsAt: slotEnd.toISOString() });
        }

        cursor = addMinutes(cursor, rule.slotIntervalMinutes);
      }
    }

    // Sort and deduplicate (in case multiple rules cover same time)
    const seen = new Set<string>();
    const unique = slots
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .filter((s) => {
        if (seen.has(s.startsAt)) return false;
        seen.add(s.startsAt);
        return true;
      });

    return { date, staffProfileId, serviceId, slots: unique };
  }
}
