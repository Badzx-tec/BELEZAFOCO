import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type { CreateServiceDto } from "./dto/create-service.dto";
import type { UpdateServiceDto } from "./dto/update-service.dto";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, page = 1, limit = 50, includeInactive = false) {
    const where = {
      workspaceId,
      ...(includeInactive ? {} : { isActive: true })
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.service.count({ where })
    ]);
    return { data, total, page, limit };
  }

  async findOne(workspaceId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, workspaceId },
      include: { category: { select: { id: true, name: true, slug: true } } }
    });
    if (!service) throw new NotFoundException("Service not found");
    return service;
  }

  async create(workspaceId: string, dto: CreateServiceDto) {
    const slug = dto.slug ?? slugify(dto.name);
    const existing = await this.prisma.service.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } }
    });
    if (existing) throw new ConflictException(`Service slug "${slug}" already exists`);
    return this.prisma.service.create({
      data: {
        workspaceId,
        name: dto.name,
        slug,
        description: dto.description,
        pricingModel: dto.pricingModel ?? "fixed",
        priceCents: dto.priceCents,
        depositRequired: dto.depositRequired ?? false,
        depositAmountCents: dto.depositAmountCents,
        durationMinutes: dto.durationMinutes,
        bufferBeforeMinutes: dto.bufferBeforeMinutes ?? 0,
        bufferAfterMinutes: dto.bufferAfterMinutes ?? 0,
        categoryId: dto.categoryId
      }
    });
  }

  async update(workspaceId: string, id: string, dto: UpdateServiceDto) {
    await this.findOne(workspaceId, id);
    if (dto.slug) {
      const conflict = await this.prisma.service.findFirst({
        where: { workspaceId, slug: dto.slug, id: { not: id } }
      });
      if (conflict) throw new ConflictException(`Service slug "${dto.slug}" already exists`);
    }
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async deactivate(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    return this.prisma.service.update({ where: { id }, data: { isActive: false } });
  }
}
