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
