import { Injectable } from "@nestjs/common";
import type { Prisma } from "@belezafoco/database";
import { PrismaService } from "../database/prisma.service";

export interface AuditLogParams {
  workspaceId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          actorUserId: params.actorUserId ?? undefined,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: params.metadata ?? undefined,
          ipAddress: params.ipAddress ?? undefined,
          userAgent: params.userAgent ?? undefined
        }
      });
    } catch {
      // Audit logging must never break the main flow
    }
  }
}
