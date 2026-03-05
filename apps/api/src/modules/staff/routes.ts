import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { enforcePlan } from "../../lib/plan.js";

export const staffRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/staff", async (req) => prisma.staffMember.findMany({ where: { workspaceId: req.workspaceId }, include: { staffServices: true, availabilities: true } }));

  app.post("/me/staff", async (req) => {
    const body = z.object({ name: z.string(), contact: z.string().optional(), serviceIds: z.array(z.string()), availabilities: z.array(z.object({ weekday: z.number(), startTime: z.string(), endTime: z.string() })) }).parse(req.body);
    const subscription = await prisma.workspaceSubscription.findUniqueOrThrow({ where: { workspaceId: req.workspaceId } });
    const staffCount = await prisma.staffMember.count({ where: { workspaceId: req.workspaceId } });
    const resourceCount = await prisma.resource.count({ where: { workspaceId: req.workspaceId } });
    const gate = enforcePlan(subscription.plan, staffCount + 1, resourceCount, subscription.appointmentsThisMonth);
    if (!gate.allowed) throw app.httpErrors.paymentRequired(gate.reason);

    return prisma.staffMember.create({
      data: {
        workspaceId: req.workspaceId,
        name: body.name,
        contact: body.contact,
        staffServices: { createMany: { data: body.serviceIds.map((id) => ({ serviceId: id })) } },
        availabilities: { createMany: { data: body.availabilities } }
      }
    });
  });
};
