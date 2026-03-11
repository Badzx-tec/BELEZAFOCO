import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { z } from "zod";

export const billingRoutes: FastifyPluginAsync = async (app) => {
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
