export const appRoles = ["owner", "manager", "receptionist", "staff"] as const;
export type AppRole = (typeof appRoles)[number];
