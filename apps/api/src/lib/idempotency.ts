import { prisma } from "./prisma.js";

type IdempotencyIdentity = {
  scope: string;
  key: string;
  workspaceId?: string;
};

export class IdempotencyConflictError extends Error {
  constructor() {
    super("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
  }
}

export function buildIdempotencyNamespace(input: IdempotencyIdentity) {
  return `${input.scope}:${input.workspaceId ?? "global"}:${input.key}`;
}

export async function rememberIdempotency(input: {
  scope: string;
  key: string;
  workspaceId?: string;
  requestHash?: string;
  responseBody?: unknown;
  statusCode?: number;
}) {
  const namespaceKey = buildIdempotencyNamespace(input);
  const existing = await prisma.idempotencyKey.findUnique({
    where: { namespaceKey }
  });

  if (existing?.requestHash && input.requestHash && existing.requestHash !== input.requestHash) {
    throw new IdempotencyConflictError();
  }

  return prisma.idempotencyKey.upsert({
    where: { namespaceKey },
    update: {
      requestHash: input.requestHash,
      responseBody: input.responseBody as never,
      statusCode: input.statusCode
    },
    create: {
      scope: input.scope,
      namespaceKey,
      key: input.key,
      workspaceId: input.workspaceId,
      requestHash: input.requestHash,
      responseBody: input.responseBody as never,
      statusCode: input.statusCode
    }
  });
}

export async function findIdempotency(input: IdempotencyIdentity) {
  return prisma.idempotencyKey.findUnique({
    where: { namespaceKey: buildIdempotencyNamespace(input) }
  });
}
