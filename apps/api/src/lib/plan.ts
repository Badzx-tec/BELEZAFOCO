import type { SubscriptionPlan } from "@prisma/client";

export const planLimits = {
  trial: { staff: 2, resources: 1, appointments: 60 },
  basic: { staff: 4, resources: 2, appointments: 300 },
  pro: { staff: Number.POSITIVE_INFINITY, resources: Number.POSITIVE_INFINITY, appointments: Number.POSITIVE_INFINITY }
} as const;

export const founderPlanCatalog = {
  trial: {
    label: "Fundador Solo",
    monthlyPriceCents: 5900,
    description: "Para profissionais solo que querem vender melhor sem depender de improviso.",
    features: ["1 a 2 profissionais", "Link publico premium", "Agenda e confirmacao essenciais"]
  },
  basic: {
    label: "Fundador Equipe Pequena",
    monthlyPriceCents: 9900,
    description: "Para estudios com equipe pequena, operacao intensa e necessidade de controle diario.",
    features: ["Ate 4 profissionais", "Pix e WhatsApp automatizados", "Leitura operacional do workspace"]
  },
  pro: {
    label: "Fundador Pro",
    monthlyPriceCents: 14900,
    description: "Para negocios que precisam de mais folga operacional, equipe maior e rollout comercial.",
    features: ["Equipe e recursos ampliados", "Mais volume mensal", "Base pronta para expansao"]
  }
} as const;

export function getPlanLimits(plan: SubscriptionPlan) {
  return planLimits[plan];
}

export function enforcePlan(plan: SubscriptionPlan, staffCount: number, resourceCount: number, apptsThisMonth: number) {
  const limits = getPlanLimits(plan);
  if (staffCount > limits.staff) return { allowed: false, reason: "Limite de profissionais excedido para o plano atual" };
  if (resourceCount > limits.resources) return { allowed: false, reason: "Limite de recursos excedido para o plano atual" };
  if (apptsThisMonth > limits.appointments) return { allowed: false, reason: "Limite mensal de agendamentos excedido" };
  return { allowed: true };
}
