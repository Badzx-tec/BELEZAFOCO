import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type { CreateStaffDto } from "./dto/create-staff.dto";
import type { UpdateStaffDto } from "./dto/update-staff.dto";

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, includeInactive = false) {
    return this.prisma.staffProfile.findMany({
      where: {
        workspaceId,
        ...(includeInactive ? {} : { status: "active" })
      },
      orderBy: { displayName: "asc" }
    });
  }

  async findOne(workspaceId: string, id: string) {
    const staff = await this.prisma.staffProfile.findFirst({
      where: { id, workspaceId }
    });
    if (!staff) throw new NotFoundException("Staff not found");
    return staff;
  }

  async create(workspaceId: string, dto: CreateStaffDto) {
    if (dto.userId) {
      const existing = await this.prisma.staffProfile.findFirst({
        where: { workspaceId, userId: dto.userId }
      });
      if (existing) throw new ConflictException("This user is already linked to a staff profile");
    }
    return this.prisma.staffProfile.create({
      data: {
        workspaceId,
        fullName: dto.fullName,
        displayName: dto.displayName,
        bio: dto.bio,
        colorHex: dto.colorHex ?? "#c26b36",
        commissionPercent: dto.commissionPercent,
        canReceiveBookings: dto.canReceiveBookings ?? true,
        userId: dto.userId
      }
    });
  }

  async update(workspaceId: string, id: string, dto: UpdateStaffDto) {
    await this.findOne(workspaceId, id);
    const { commissionPercent, ...rest } = dto;
    return this.prisma.staffProfile.update({
      where: { id },
      data: {
        ...rest,
        ...(commissionPercent !== undefined ? { commissionPercent } : {})
      }
    });
  }

  async deactivate(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    return this.prisma.staffProfile.update({
      where: { id },
      data: { status: "inactive" }
    });
  }
}
