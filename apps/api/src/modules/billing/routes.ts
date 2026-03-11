import { FastifyPluginAsync } from "fastify";
import { startOfMonth } from "date-fns";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { z } from "zod";
import { founderPlanCatalog, getPlanLimits } from "../../lib/plan.js";
import { hasAnyRole, requireRole } from "../../lib/permissions.js";

function serializeLimit(limit: number) {
  return Number.isFinite(limit) ? limit : null;
}

export const billingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/billing/summary", async (req) => {
    requireRole(app, req, ["staff"]);

    const monthStart = startOfMonth(new Date());
    const [workspace, subscription, staffCount, resourceCount, appointmentsThisMonth] = await Promise.all([
      prisma.workspace.findUniqueOrThrow({
        where: { id: req.workspaceId },
        select: { id: true, name: true, slug: true, createdAt: true }
      }),
      prisma.workspaceSubscription.findUniqueOrThrow({
        where: { workspaceId: req.workspaceId }
      }),
      prisma.staffMember.count({ where: { workspaceId: req.workspaceId, active: true } }),
      prisma.resource.count({ where: { workspaceId: req.workspaceId, active: true } }),
      prisma.appointment.count({ where: { workspaceId: req.workspaceId, startAt: { gte: monthStart } } })
    ]);

    const currentLimits = getPlanLimits(subscription.plan);

    return {
      workspace,
      canManage: hasAnyRole(req.membershipRole, ["manager"]),
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        paidUntil: subscription.paidUntil,
        trialEndsAt: subscription.trialEndsAt
      },
      usage: {
        staff: staffCount,
        resources: resourceCount,
        appointmentsThisMonth
      },
      limits: {
        staff: serializeLimit(currentLimits.staff),
        resources: serializeLimit(currentLimits.resources),
        appointments: serializeLimit(currentLimits.appointments)
      },
      plans: Object.entries(founderPlanCatalog).map(([id, meta]) => {
        const limits = getPlanLimits(id as keyof typeof founderPlanCatalog);
        return {
          id,
          label: meta.label,
          monthlyPriceCents: meta.monthlyPriceCents,
          description: meta.description,
          features: meta.features,
          current: subscription.plan === id,
          limits: {
            staff: serializeLimit(limits.staff),
            resources: serializeLimit(limits.resources),
            appointments: serializeLimit(limits.appointments)
          }
        };
      })
    };
  });

  app.post("/me/billing/request-upgrade", async (req) => {
    requireRole(app, req, ["manager"]);

    const body = z
      .object({
        plan: z.enum(["trial", "basic", "pro"]),
        paymentMethod: z.enum(["pix", "card"])
      })
      .parse(req.body);

    const subscription = await prisma.workspaceSubscription.findUniqueOrThrow({
      where: { workspaceId: req.workspaceId }
    });

    if (subscription.plan === body.plan) {
      return {
        ok: true,
        message: "Esse plano ja esta vinculado ao workspace. Se quiser, atualize apenas a forma de pagamento com o time comercial."
      };
    }

    await prisma.auditLog.create({
      data: {
        workspaceId: req.workspaceId,
        actorUserId: (req.user as any).sub,
        action: "billing.upgrade_requested",
        entityType: "workspace_subscription",
        entityId: subscription.id,
        payload: JSON.stringify({
          currentPlan: subscription.plan,
          requestedPlan: body.plan,
          paymentMethod: body.paymentMethod,
          requestedAt: new Date().toISOString()
        })
      }
    });

    return {
      ok: true,
      message:
        body.paymentMethod === "pix"
          ? "Pedido de upgrade registrado. Use Pix empresarial com o time BELEZAFOCO para concluir a ativacao."
          : "Pedido de upgrade registrado. O time BELEZAFOCO finaliza a ativacao com a forma de pagamento selecionada."
    };
  });

  app.patch("/admin/workspaces/:id/subscription", async (req) => {
    const user = await prisma.user.findUnique({ where: { id: (req.user as any).sub } });
    if (!user || user.email !== env.SUPERADMIN_EMAIL) throw app.httpErrors.forbidden();

    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        plan: z.enum(["trial", "basic", "pro"]),
        status: z.enum(["trialing", "active", "past_due", "cancelled"]).default("active"),
        paidUntil: z.string(),
        trialEndsAt: z.string().optional()
      })
      .parse(req.body);

    return prisma.workspaceSubscription.upsert({
      where: { workspaceId: params.id },
      update: {
        plan: body.plan,
        status: body.status,
        paidUntil: new Date(body.paidUntil),
        trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : undefined
      },
      create: {
        workspaceId: params.id,
        plan: body.plan,
        status: body.status,
        paidUntil: new Date(body.paidUntil),
        trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : undefined
      }
    });
  });
};
