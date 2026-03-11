import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { requireRole } from "../../lib/permissions.js";

const workspaceSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  description: z.string().max(400).optional().nullable(),
  bookingPolicy: z.string().max(1000).optional().nullable(),
  timezone: z.string(),
  brandPrimaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  brandAccentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  minAdvanceMinutes: z.number().int().min(0).max(4320),
  maxAdvanceDays: z.number().int().min(1).max(365),
  freeCancelHours: z.number().int().min(0).max(168),
  lateCancelFeePercent: z.number().int().min(0).max(100),
  noShowFeePercent: z.number().int().min(0).max(100),
  onboardingStep: z.number().int().min(0).max(10).default(0)
});

const businessHoursSchema = z.array(
  z.object({
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/)
  })
);

const templateSchema = z.object({
  type: z.string(),
  templateName: z.string(),
  language: z.string().default("pt_BR"),
  body: z.string()
});

const calendarBlockSchema = z.object({
  title: z.string().min(2),
  scope: z.enum(["workspace", "staff", "resource"]),
  type: z.enum(["manual_block", "holiday", "time_off", "break"]).default("manual_block"),
  startAt: z.string(),
  endAt: z.string(),
  staffMemberId: z.string().optional(),
  resourceId: z.string().optional()
});

function buildChecklist(data: {
  workspace: { address: string | null; whatsapp: string | null; description: string | null };
  businessHoursCount: number;
  servicesCount: number;
  staffCount: number;
  templatesCount: number;
  resourcesCount: number;
}) {
  const items = [
    {
      id: "profile",
      title: "Identidade do negócio",
      completed: Boolean(data.workspace.address && data.workspace.whatsapp && data.workspace.description)
    },
    {
      id: "hours",
      title: "Horários de funcionamento",
      completed: data.businessHoursCount > 0
    },
    {
      id: "services",
      title: "Catálogo de serviços",
      completed: data.servicesCount > 0
    },
    {
      id: "staff",
      title: "Profissionais",
      completed: data.staffCount > 0
    },
    {
      id: "templates",
      title: "Lembretes automáticos",
      completed: data.templatesCount > 0
    },
    {
      id: "operations",
      title: "Recursos e operação",
      completed: data.resourcesCount > 0
    }
  ];

  const completed = items.filter((item) => item.completed).length;
  return { items, completed, total: items.length, percent: Math.round((completed / items.length) * 100) };
}

export const workspaceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/workspace", async (req) => {
    requireRole(app, req, ["staff"]);
    return prisma.workspace.findUnique({
      where: { id: req.workspaceId },
      include: {
        businessHours: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
        subscription: true
      }
    });
  });

  app.put("/me/workspace", async (req) => {
    requireRole(app, req, ["manager"]);
    const body = workspaceSchema.parse(req.body);
    const updated = await prisma.workspace.update({
      where: { id: req.workspaceId },
      data: {
        ...body,
        onboardingCompletedAt: body.onboardingStep >= 6 ? new Date() : null
      }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: req.workspaceId,
        actorUserId: (req.user as any).sub,
        action: "workspace.updated",
        entityType: "workspace",
        entityId: updated.id,
        payload: JSON.stringify(body)
      }
    });

    return updated;
  });

  app.get("/me/onboarding-summary", async (req) => {
    requireRole(app, req, ["staff"]);
    const [workspace, businessHoursCount, servicesCount, staffCount, templatesCount, resourcesCount] = await Promise.all([
      prisma.workspace.findUniqueOrThrow({
        where: { id: req.workspaceId },
        select: { id: true, slug: true, address: true, whatsapp: true, description: true, onboardingStep: true }
      }),
      prisma.businessHour.count({ where: { workspaceId: req.workspaceId } }),
      prisma.service.count({ where: { workspaceId: req.workspaceId, active: true } }),
      prisma.staffMember.count({ where: { workspaceId: req.workspaceId, active: true } }),
      prisma.messageTemplate.count({ where: { workspaceId: req.workspaceId } }),
      prisma.resource.count({ where: { workspaceId: req.workspaceId, active: true } })
    ]);

    return {
      workspace,
      checklist: buildChecklist({
        workspace,
        businessHoursCount,
        servicesCount,
        staffCount,
        templatesCount,
        resourcesCount
      }),
      publicBookingUrl: `/b/${workspace.slug}`
    };
  });

  app.put("/me/business-hours", async (req) => {
    requireRole(app, req, ["manager"]);
    const body = businessHoursSchema.parse(req.body);
    await prisma.businessHour.deleteMany({ where: { workspaceId: req.workspaceId } });
    await prisma.businessHour.createMany({
      data: body.map((item) => ({ ...item, workspaceId: req.workspaceId }))
    });
    return { ok: true };
  });

  app.put("/me/templates", async (req) => {
    requireRole(app, req, ["manager"]);
    const body = templateSchema.parse(req.body);
    return prisma.messageTemplate.upsert({
      where: { workspaceId_type: { workspaceId: req.workspaceId, type: body.type } },
      update: body,
      create: { ...body, workspaceId: req.workspaceId }
    });
  });

  app.get("/me/calendar-blocks", async (req) => {
    requireRole(app, req, ["staff"]);
    const query = z
      .object({
        from: z.string().optional(),
        to: z.string().optional()
      })
      .parse(req.query);

    return prisma.calendarBlock.findMany({
      where: {
        workspaceId: req.workspaceId,
        ...(query.from || query.to
          ? {
              startAt: query.to ? { lt: new Date(query.to) } : undefined,
              endAt: query.from ? { gt: new Date(query.from) } : undefined
            }
          : {})
      },
      orderBy: { startAt: "asc" }
    });
  });

  app.post("/me/calendar-blocks", async (req) => {
    requireRole(app, req, ["manager"]);
    const body = calendarBlockSchema.parse(req.body);
    const block = await prisma.calendarBlock.create({
      data: {
        workspaceId: req.workspaceId,
        title: body.title,
        scope: body.scope,
        type: body.type,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        staffMemberId: body.scope === "staff" ? body.staffMemberId : null,
        resourceId: body.scope === "resource" ? body.resourceId : null
      }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: req.workspaceId,
        actorUserId: (req.user as any).sub,
        action: "calendar_block.created",
        entityType: "calendar_block",
        entityId: block.id,
        payload: JSON.stringify(body)
      }
    });

    return block;
  });
};
