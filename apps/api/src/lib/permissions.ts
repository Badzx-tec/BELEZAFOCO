import type { AppRole } from "./types.js";

const roleWeight: Record<AppRole, number> = {
  owner: 40,
  manager: 30,
  receptionist: 20,
  staff: 10
};

export function hasRole(role: AppRole, minimumRole: AppRole) {
  return roleWeight[role] >= roleWeight[minimumRole];
}

export function assertRole(role: AppRole, minimumRole: AppRole) {
  if (!hasRole(role, minimumRole)) {
    throw new Error("FORBIDDEN");
  }
}
