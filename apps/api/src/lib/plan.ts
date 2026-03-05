import type { SubscriptionPlan } from "@prisma/client";

export function enforcePlan(plan: SubscriptionPlan, staffCount: number, resourceCount: number, apptsThisMonth: number) {
  if (plan === "pro") return { allowed: true };
  const limits = { staff: 3, resources: 1, appointments: 300 };
  if (staffCount > limits.staff) return { allowed: false, reason: "Limite de profissionais excedido" };
  if (resourceCount > limits.resources) return { allowed: false, reason: "Limite de recursos excedido" };
  if (apptsThisMonth > limits.appointments) return { allowed: false, reason: "Limite mensal de agendamentos excedido" };
  return { allowed: true };
}
