import type { SubscriptionPlan } from "@prisma/client";

const planLimits = {
  trial: { staff: 2, resources: 1, appointments: 60 },
  basic: { staff: 4, resources: 2, appointments: 300 },
  pro: { staff: Number.POSITIVE_INFINITY, resources: Number.POSITIVE_INFINITY, appointments: Number.POSITIVE_INFINITY }
} as const;

export function enforcePlan(plan: SubscriptionPlan, staffCount: number, resourceCount: number, apptsThisMonth: number) {
  const limits = planLimits[plan];
  if (staffCount > limits.staff) return { allowed: false, reason: "Limite de profissionais excedido para o plano atual" };
  if (resourceCount > limits.resources) return { allowed: false, reason: "Limite de recursos excedido para o plano atual" };
  if (apptsThisMonth > limits.appointments) return { allowed: false, reason: "Limite mensal de agendamentos excedido" };
  return { allowed: true };
}
