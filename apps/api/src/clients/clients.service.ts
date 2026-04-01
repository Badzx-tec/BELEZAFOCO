import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@belezafoco/database";
import { PrismaService } from "../database/prisma.service";
import type { CreateClientDto } from "./dto/create-client.dto";
import type { UpdateClientDto } from "./dto/update-client.dto";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, page = 1, limit = 50, q?: string) {
    const where: Prisma.ClientWhereInput = {
      workspaceId,
      status: { not: "archived" },
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } }
            ]
          }
        : {})
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        orderBy: { fullName: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.client.count({ where })
    ]);
    return { data, total, page, limit };
  }

  async findOne(workspaceId: string, id: string) {
    const client = await this.prisma.client.findFirst({ where: { id, workspaceId } });
    if (!client) throw new NotFoundException("Client not found");
    return client;
  }

  async create(workspaceId: string, dto: CreateClientDto) {
    if (dto.email) {
      const existing = await this.prisma.client.findUnique({
        where: { workspaceId_email: { workspaceId, email: dto.email } }
      });
      if (existing) throw new ConflictException("A client with this email already exists");
    }
    if (dto.phone) {
      const existing = await this.prisma.client.findUnique({
        where: { workspaceId_phone: { workspaceId, phone: dto.phone } }
      });
      if (existing) throw new ConflictException("A client with this phone already exists");
    }
    const now = new Date();
    return this.prisma.client.create({
      data: {
        workspaceId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        notes: dto.notes,
        communicationConsent: dto.communicationConsent ?? false,
        whatsappConsent: dto.whatsappConsent ?? false,
        emailConsent: dto.emailConsent ?? false,
        marketingConsentAt:
          (dto.communicationConsent || dto.whatsappConsent || dto.emailConsent) ? now : undefined
      }
    });
  }

  async update(workspaceId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(workspaceId, id);
    if (dto.email) {
      const conflict = await this.prisma.client.findFirst({
        where: { workspaceId, email: dto.email, id: { not: id } }
      });
      if (conflict) throw new ConflictException("A client with this email already exists");
    }
    if (dto.phone) {
      const conflict = await this.prisma.client.findFirst({
        where: { workspaceId, phone: dto.phone, id: { not: id } }
      });
      if (conflict) throw new ConflictException("A client with this phone already exists");
    }
    const { birthDate, ...rest } = dto;
    return this.prisma.client.update({
      where: { id },
      data: {
        ...rest,
        ...(birthDate !== undefined ? { birthDate: birthDate ? new Date(birthDate) : null } : {})
      }
    });
  }
}
