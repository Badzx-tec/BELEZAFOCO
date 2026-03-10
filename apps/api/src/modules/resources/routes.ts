import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { assertRole } from "../../lib/permissions.js";
import { slugify } from "../../lib/slug.js";
import { enforcePlan } from "../../lib/plan.js";

export const resourceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/resources", async (req) =>
    prisma.resource.findMany({
      where: { workspaceId: req.workspaceId },
      orderBy: { name: "asc" }
    })
  );

  app.post("/me/resources", async (req) => {
    assertRole(req.membershipRole, "manager");
    const body = z
      .object({
        name: z.string().min(2),
        slug: z.string().optional(),
        type: z.string().min(2),
        capacity: z.number().int().min(1).max(10).default(1),
        active: z.boolean().default(true)
      })
      .parse(req.body);

    const subscription = await prisma.workspaceSubscription.findUniqueOrThrow({
      where: { workspaceId: req.workspaceId }
    });
    const staffCount = await prisma.staffMember.count({ where: { workspaceId: req.workspaceId, active: true } });
    const resourceCount = await prisma.resource.count({ where: { workspaceId: req.workspaceId, active: true } });
    const gate = enforcePlan(subscription, staffCount, resourceCount + 1, subscription.appointmentsThisMonth);
    if (!gate.allowed) {
      throw app.httpErrors.paymentRequired(gate.reason ?? "Limite do plano atingido.");
    }

    return prisma.resource.create({
      data: {
        workspaceId: req.workspaceId,
        name: body.name,
        slug: slugify(body.slug ?? body.name),
        type: body.type,
        capacity: body.capacity,
        active: body.active
      }
    });
  });
};
