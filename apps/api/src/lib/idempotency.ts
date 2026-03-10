import { prisma } from "./prisma.js";

export async function rememberIdempotency(input: {
  scope: string;
  key: string;
  workspaceId?: string;
  requestHash?: string;
  responseBody?: unknown;
  statusCode?: number;
}) {
  return prisma.idempotencyKey.upsert({
    where: { key: input.key },
    update: {
      requestHash: input.requestHash,
      responseBody: input.responseBody as never,
      statusCode: input.statusCode
    },
    create: {
      scope: input.scope,
      key: input.key,
      workspaceId: input.workspaceId,
      requestHash: input.requestHash,
      responseBody: input.responseBody as never,
      statusCode: input.statusCode
    }
  });
}

export async function findIdempotency(key: string) {
  return prisma.idempotencyKey.findUnique({ where: { key } });
}
