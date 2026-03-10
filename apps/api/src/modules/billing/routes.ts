import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { buildSubscriptionSeed } from "../../lib/plan.js";

export const billingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/billing", async (req) =>
    prisma.workspaceSubscription.findUniqueOrThrow({
      where: { workspaceId: req.workspaceId }
    })
  );

  app.patch("/admin/workspaces/:id/subscription", async (req) => {
    await app.authenticate(req as never);
    const user = await prisma.user.findUnique({ where: { id: (req.user as any).sub as string } });
    if (!user || user.email !== env.SUPERADMIN_EMAIL) {
      throw app.httpErrors.forbidden();
    }

    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        plan: z.enum(["trial", "basic", "pro"]),
        status: z.enum(["trialing", "active", "past_due", "paused", "cancelled"]),
        paidUntil: z.string(),
        trialEndsAt: z.string().optional()
      })
      .parse(req.body);

    const seed = buildSubscriptionSeed(body.plan);
    return prisma.workspaceSubscription.upsert({
      where: { workspaceId: params.id },
      update: {
        plan: body.plan,
        status: body.status,
        paidUntil: new Date(body.paidUntil),
        trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : seed.trialEndsAt,
        staffLimit: seed.staffLimit,
        resourceLimit: seed.resourceLimit,
        monthlyAppointmentsLimit: seed.monthlyAppointmentsLimit
      },
      create: {
        workspaceId: params.id,
        plan: body.plan,
        status: body.status,
        paidUntil: new Date(body.paidUntil),
        trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : seed.trialEndsAt,
        staffLimit: seed.staffLimit,
        resourceLimit: seed.resourceLimit,
        monthlyAppointmentsLimit: seed.monthlyAppointmentsLimit
      }
    });
  });
};
