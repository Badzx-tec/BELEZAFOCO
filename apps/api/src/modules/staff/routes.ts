import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { enforcePlan } from "../../lib/plan.js";
import { assertRole } from "../../lib/permissions.js";
import { slugify } from "../../lib/slug.js";
import { writeAudit } from "../../lib/audit.js";

const availabilitySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/)
});

export const staffRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/staff", async (req) =>
    prisma.staffMember.findMany({
      where: { workspaceId: req.workspaceId },
      include: {
        staffServices: true,
        availabilities: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
        exceptions: { orderBy: { startsAt: "asc" }, take: 5 }
      },
      orderBy: { name: "asc" }
    })
  );

  app.post("/me/staff", async (req) => {
    assertRole(req.membershipRole, "manager");
    const body = z
      .object({
        name: z.string().min(2),
        slug: z.string().optional(),
        contact: z.string().optional().nullable(),
        bio: z.string().max(500).optional().nullable(),
        color: z.string().min(4).max(20).default("#0f172a"),
        commissionPercent: z.number().int().min(0).max(100).default(0),
        isBookable: z.boolean().default(true),
        active: z.boolean().default(true),
        serviceIds: z.array(z.string()).min(1),
        availabilities: z.array(availabilitySchema).min(1)
      })
      .parse(req.body);
    const serviceIds = [...new Set(body.serviceIds)];

    const subscription = await prisma.workspaceSubscription.findUniqueOrThrow({
      where: { workspaceId: req.workspaceId }
    });
    const staffCount = await prisma.staffMember.count({ where: { workspaceId: req.workspaceId, active: true } });
    const resourceCount = await prisma.resource.count({ where: { workspaceId: req.workspaceId, active: true } });
    const gate = enforcePlan(subscription, staffCount + 1, resourceCount, subscription.appointmentsThisMonth);
    if (!gate.allowed) {
      throw app.httpErrors.paymentRequired(gate.reason ?? "Limite do plano atingido.");
    }

    const availableServices = await prisma.service.findMany({
      where: {
        workspaceId: req.workspaceId,
        id: { in: serviceIds },
        active: true
      },
      select: { id: true }
    });

    if (availableServices.length !== serviceIds.length) {
      throw app.httpErrors.badRequest("Um ou mais servicos nao pertencem a este workspace.");
    }

    const staffMember = await prisma.staffMember.create({
      data: {
        workspaceId: req.workspaceId,
        name: body.name,
        slug: slugify(body.slug ?? body.name),
        contact: body.contact ?? null,
        bio: body.bio ?? null,
        color: body.color,
        commissionPercent: body.commissionPercent,
        isBookable: body.isBookable,
        active: body.active,
        staffServices: {
          createMany: {
            data: serviceIds.map((serviceId) => ({ serviceId }))
          }
        },
        availabilities: {
          createMany: {
            data: body.availabilities
          }
        }
      }
    });

    await prisma.workspace.update({
      where: { id: req.workspaceId },
      data: { onboardingStep: 4 }
    });

    await writeAudit({
      workspaceId: req.workspaceId,
      actorUserId: req.userId,
      action: "staff.created",
      entityType: "staff_member",
      entityId: staffMember.id,
      payload: {
        ...body,
        serviceIds
      }
    });

    return staffMember;
  });

  app.post("/me/staff/:id/exceptions", async (req) => {
    assertRole(req.membershipRole, "manager");
    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        startsAt: z.string(),
        endsAt: z.string(),
        reason: z.string().min(2).optional()
      })
      .parse(req.body);

    const staffMember = await prisma.staffMember.findFirst({
      where: {
        id: params.id,
        workspaceId: req.workspaceId
      }
    });

    if (!staffMember) {
      throw app.httpErrors.notFound("Profissional nao encontrado.");
    }

    return prisma.staffException.create({
      data: {
        staffMemberId: staffMember.id,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        reason: body.reason
      }
    });
  });
};
