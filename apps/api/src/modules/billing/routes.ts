import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { z } from "zod";

export const billingRoutes: FastifyPluginAsync = async (app) => {
  app.patch("/admin/workspaces/:id/subscription", async (req) => {
    await app.auth(req as any);
    const user = await prisma.user.findUnique({ where: { id: (req.user as any).sub } });
    if (!user || user.email !== env.SUPERADMIN_EMAIL) throw app.httpErrors.forbidden();
    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ plan: z.enum(["trial", "basic", "pro"]), paidUntil: z.string() }).parse(req.body);
    return prisma.workspaceSubscription.upsert({ where: { workspaceId: params.id }, update: { plan: body.plan, paidUntil: new Date(body.paidUntil) }, create: { workspaceId: params.id, plan: body.plan, paidUntil: new Date(body.paidUntil) } });
  });
};
