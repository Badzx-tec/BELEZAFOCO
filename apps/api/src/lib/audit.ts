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
    data: { ...input, payload: JSON.stringify(input.payload) }
  });
}
