import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { enforcePlan } from "../../lib/plan.js";
import { requireRole } from "../../lib/permissions.js";

const availabilitySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/)
});

export const staffRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/staff", async (req) => {
    requireRole(app, req, ["staff"]);
    return prisma.staffMember.findMany({
      where: { workspaceId: req.workspaceId },
      include: {
        staffServices: true,
        availabilities: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
        exceptions: { orderBy: { startAt: "asc" } }
      },
      orderBy: { name: "asc" }
    });
  });

  app.post("/me/staff", async (req) => {
    requireRole(app, req, ["manager"]);
    const body = z
      .object({
        name: z.string().min(2),
        bio: z.string().optional().nullable(),
        contact: z.string().optional().nullable(),
        colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#1d4ed8"),
        commissionPercent: z.number().int().min(0).max(100).default(0),
        serviceIds: z.array(z.string()).min(1),
        availabilities: z.array(availabilitySchema).min(1)
      })
      .parse(req.body);

    const subscription = await prisma.workspaceSubscription.findUniqueOrThrow({ where: { workspaceId: req.workspaceId } });
    const staffCount = await prisma.staffMember.count({ where: { workspaceId: req.workspaceId, active: true } });
    const resourceCount = await prisma.resource.count({ where: { workspaceId: req.workspaceId, active: true } });
    const gate = enforcePlan(subscription.plan, staffCount + 1, resourceCount, subscription.appointmentsThisMonth);
    if (!gate.allowed) throw app.httpErrors.paymentRequired(gate.reason);

    return prisma.staffMember.create({
      data: {
        workspaceId: req.workspaceId,
        name: body.name,
        bio: body.bio,
        contact: body.contact,
        colorHex: body.colorHex,
        commissionPercent: body.commissionPercent,
        staffServices: { createMany: { data: body.serviceIds.map((id) => ({ serviceId: id })) } },
        availabilities: { createMany: { data: body.availabilities } }
      }
    });
  });

  app.post("/me/staff/:id/exceptions", async (req) => {
    requireRole(app, req, ["manager"]);
    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        startAt: z.string(),
        endAt: z.string(),
        reason: z.string().optional().nullable()
      })
      .parse(req.body);

    return prisma.staffException.create({
      data: {
        staffMemberId: params.id,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        reason: body.reason
      }
    });
  });
};
