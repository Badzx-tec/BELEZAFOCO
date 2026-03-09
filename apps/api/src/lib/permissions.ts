import type { FastifyInstance, FastifyRequest } from "fastify";

const roleWeight = {
  owner: 40,
  manager: 30,
  receptionist: 20,
  staff: 10
} as const;

type RoleName = keyof typeof roleWeight;

export function hasAnyRole(currentRole: string | undefined, allowedRoles: RoleName[]) {
  if (!currentRole) return false;
  return allowedRoles.some((role) => roleWeight[currentRole as RoleName] >= roleWeight[role]);
}

export function requireRole(app: FastifyInstance, request: FastifyRequest, allowedRoles: RoleName[]) {
  if (!hasAnyRole(request.membershipRole, allowedRoles)) {
    throw app.httpErrors.forbidden("Sem permissão para esta ação");
  }
}
