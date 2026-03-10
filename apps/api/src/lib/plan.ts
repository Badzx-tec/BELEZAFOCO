import type { SubscriptionPlan, SubscriptionStatus, WorkspaceSubscription } from "@prisma/client";

type PlanCheckResult = {
  allowed: boolean;
  reason?: string;
};

const defaults: Record<
  SubscriptionPlan,
  { staffLimit: number; resourceLimit: number; monthlyAppointmentsLimit: number; status: SubscriptionStatus }
> = {
  trial: { staffLimit: 3, resourceLimit: 2, monthlyAppointmentsLimit: 200, status: "trialing" },
  basic: { staffLimit: 6, resourceLimit: 4, monthlyAppointmentsLimit: 600, status: "active" },
  pro: { staffLimit: 1000, resourceLimit: 1000, monthlyAppointmentsLimit: 100000, status: "active" }
};

export function buildSubscriptionSeed(plan: SubscriptionPlan, now = new Date()) {
  const limits = defaults[plan];
  const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const paidUntil = plan === "trial" ? trialEndsAt : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    plan,
    status: limits.status,
    trialEndsAt,
    paidUntil,
    staffLimit: limits.staffLimit,
    resourceLimit: limits.resourceLimit,
    monthlyAppointmentsLimit: limits.monthlyAppointmentsLimit
  };
}

export function enforcePlan(subscription: Pick<WorkspaceSubscription, "plan" | "status" | "staffLimit" | "resourceLimit" | "monthlyAppointmentsLimit" | "appointmentsThisMonth">, staffCount: number, resourceCount: number, apptsThisMonth: number): PlanCheckResult {
  if (subscription.status === "cancelled" || subscription.status === "past_due") {
    return { allowed: false, reason: "Assinatura inativa para novas operações." };
  }
  if (staffCount > subscription.staffLimit) return { allowed: false, reason: "Limite de profissionais excedido para o plano atual." };
  if (resourceCount > subscription.resourceLimit) return { allowed: false, reason: "Limite de recursos excedido para o plano atual." };
  if (apptsThisMonth > subscription.monthlyAppointmentsLimit) return { allowed: false, reason: "Limite mensal de agendamentos excedido." };
  return { allowed: true };
}
