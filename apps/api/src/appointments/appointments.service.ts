import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import { Prisma } from "@belezafoco/database";
import { PrismaService } from "../database/prisma.service";
import type { CreateAppointmentDto } from "./dto/create-appointment.dto";
import type { ListAppointmentsDto } from "./dto/list-appointments.dto";
import { AppointmentStatus, isValidTransition, type UpdateStatusDto } from "./dto/update-status.dto";

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, query: ListAppointmentsDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 50;

    let dateFilter: Prisma.AppointmentWhereInput = {};
    if (query.date) {
      const [y, m, d] = query.date.split("-").map(Number);
      const dayStart = new Date(y!, m! - 1, d!, 0, 0, 0, 0);
      const dayEnd = new Date(y!, m! - 1, d!, 23, 59, 59, 999);
      dateFilter = { startsAt: { gte: dayStart, lte: dayEnd } };
    }

    const where: Prisma.AppointmentWhereInput = {
      workspaceId,
      ...dateFilter,
      ...(query.staffProfileId ? { staffProfileId: query.staffProfileId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        include: {
          service: { select: { id: true, name: true, durationMinutes: true } },
          staffProfile: { select: { id: true, displayName: true, colorHex: true } },
          client: { select: { id: true, fullName: true, phone: true } }
        },
        orderBy: { startsAt: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.appointment.count({ where })
    ]);

    return { data, total, page, limit };
  }

  async findOne(workspaceId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, workspaceId },
      include: {
        service: true,
        staffProfile: { select: { id: true, displayName: true, colorHex: true } },
        client: true,
        payments: { orderBy: { createdAt: "desc" }, take: 5 }
      }
    });
    if (!appointment) throw new NotFoundException("Appointment not found");
    return appointment;
  }

  async create(workspaceId: string, dto: CreateAppointmentDto) {
    const [service, staff, client] = await Promise.all([
      this.prisma.service.findFirst({ where: { id: dto.serviceId, workspaceId, isActive: true } }),
      this.prisma.staffProfile.findFirst({ where: { id: dto.staffProfileId, workspaceId, status: "active", canReceiveBookings: true } }),
      this.prisma.client.findFirst({ where: { id: dto.clientId, workspaceId } })
    ]);

    if (!service) throw new NotFoundException("Service not found or inactive");
    if (!staff) throw new NotFoundException("Staff not found, inactive, or not accepting bookings");
    if (!client) throw new NotFoundException("Client not found");

    const startsAt = new Date(dto.startsAt);
    const totalMinutes =
      service.bufferBeforeMinutes + service.durationMinutes + service.bufferAfterMinutes;
    const endsAt = new Date(startsAt.getTime() + totalMinutes * 60_000);

    // Double-booking check
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        workspaceId,
        staffProfileId: dto.staffProfileId,
        status: { in: ["draft", "pending_payment", "confirmed", "checked_in"] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt }
      }
    });
    if (conflict) throw new ConflictException("Time slot is already booked");

    const initialStatus: AppointmentStatus = service.depositRequired
      ? AppointmentStatus.pending_payment
      : AppointmentStatus.confirmed;

    return this.prisma.appointment.create({
      data: {
        workspaceId,
        serviceId: dto.serviceId,
        staffProfileId: dto.staffProfileId,
        clientId: dto.clientId,
        startsAt,
        endsAt,
        status: initialStatus,
        notes: dto.notes,
        ...(service.depositRequired
          ? { depositRequiredAmountCents: service.depositAmountCents ?? service.priceCents }
          : {})
      },
      include: {
        service: { select: { id: true, name: true } },
        staffProfile: { select: { id: true, displayName: true } },
        client: { select: { id: true, fullName: true } }
      }
    });
  }

  async updateStatus(workspaceId: string, id: string, dto: UpdateStatusDto) {
    const appointment = await this.findOne(workspaceId, id);

    if (!isValidTransition(appointment.status, dto.status)) {
      throw new UnprocessableEntityException(
        `Cannot transition from "${appointment.status}" to "${dto.status}"`
      );
    }

    const now = new Date();
    const statusData: Prisma.AppointmentUpdateInput = { status: dto.status };

    switch (dto.status) {
      case AppointmentStatus.checked_in:
        statusData.checkedInAt = now;
        break;
      case AppointmentStatus.completed:
        statusData.completedAt = now;
        break;
      case AppointmentStatus.cancelled:
        statusData.cancelledAt = now;
        statusData.cancelledReason = dto.cancelledReason;
        break;
      case AppointmentStatus.no_show:
        statusData.noShowRecordedAt = now;
        break;
    }

    const updated = await this.prisma.appointment.update({ where: { id }, data: statusData });

    // Update client metrics on terminal states
    if (dto.status === AppointmentStatus.completed) {
      const service = await this.prisma.service.findUnique({ where: { id: appointment.serviceId } });
      await this.prisma.client.update({
        where: { id: appointment.clientId },
        data: {
          visitCount: { increment: 1 },
          lastVisitAt: now,
          totalRevenueCents: { increment: service?.priceCents ?? 0 }
        }
      });
    } else if (dto.status === AppointmentStatus.no_show) {
      await this.prisma.client.update({
        where: { id: appointment.clientId },
        data: { noShowCount: { increment: 1 }, lastNoShowAt: now }
      });
    }

    return updated;
  }
}
