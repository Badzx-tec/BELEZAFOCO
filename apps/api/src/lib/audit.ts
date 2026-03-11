import { prisma } from "./prisma.js";

export async function writeAudit(input: {
  workspaceId: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: typeof input.payload === "string" ? input.payload : JSON.stringify(input.payload)
    }
  });
}
