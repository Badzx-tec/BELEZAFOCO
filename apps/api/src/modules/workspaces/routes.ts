import { FastifyPluginAsync } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { assertRole } from "../../lib/permissions.js";
import { writeAudit } from "../../lib/audit.js";
import { slugify } from "../../lib/slug.js";

const workspaceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  timezone: z.string().default("America/Sao_Paulo"),
  address: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  brandPrimary: z.string().min(4).max(20).default("#111827"),
  brandAccent: z.string().min(4).max(20).default("#c48b5a"),
  about: z.string().max(500).optional().nullable(),
  bookingPolicy: z.string().max(1000).optional().nullable(),
  checkInPolicy: z.string().max(1000).optional().nullable(),
  minAdvanceMinutes: z.number().int().min(0).max(1440).default(120),
  maxAdvanceDays: z.number().int().min(1).max(365).default(30),
  freeCancelHours: z.number().int().min(0).max(168).default(24),
  lateCancelFeePercent: z.number().int().min(0).max(100).default(0),
  noShowFeePercent: z.number().int().min(0).max(100).default(0),
  slotIntervalMinutes: z.number().int().min(5).max(60).default(15),
  publicBookingEnabled: z.boolean().default(true),
  onboardingStep: z.number().int().min(1).max(6).default(1)
});

const businessHoursSchema = z.array(
  z.object({
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isClosed: z.boolean().default(false)
  })
);

const closureSchema = z.object({
  startsAt: z.string(),
  endsAt: z.string(),
  reason: z.string().min(2)
});

export const workspaceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/workspace", async (req) => {
    const [workspace, businessHours, closures, subscription] = await Promise.all([
      prisma.workspace.findUniqueOrThrow({ where: { id: req.workspaceId } }),
      prisma.businessHour.findMany({ where: { workspaceId: req.workspaceId }, orderBy: { weekday: "asc" } }),
      prisma.workspaceClosure.findMany({ where: { workspaceId: req.workspaceId }, orderBy: { startsAt: "asc" }, take: 10 }),
      prisma.workspaceSubscription.findUnique({ where: { workspaceId: req.workspaceId } })
    ]);

    return { workspace, businessHours, closures, subscription };
  });

  app.put("/me/workspace", async (req) => {
    assertRole(req.membershipRole, "manager");
    const body = workspaceSchema.parse(req.body);
    const slug = slugify(body.slug);

    const duplicate = await prisma.workspace.findFirst({
      where: {
        slug,
        id: { not: req.workspaceId }
      }
    });

    if (duplicate) {
      throw app.httpErrors.conflict("Slug publico indisponivel.");
    }

    const onboardingCompletedAt = body.onboardingStep >= 5 ? new Date() : null;
    const workspace = await prisma.workspace.update({
      where: { id: req.workspaceId },
      data: {
        ...body,
        slug,
        onboardingCompletedAt
      }
    });

    await writeAudit({
      workspaceId: req.workspaceId,
      actorUserId: req.userId,
      action: "workspace.updated",
      entityType: "workspace",
      entityId: workspace.id,
      payload: body
    });

    return workspace;
  });

  app.put("/me/business-hours", async (req) => {
    assertRole(req.membershipRole, "manager");
    const body = businessHoursSchema.parse(req.body);
    const seen = new Set<number>();
    for (const row of body) {
      if (seen.has(row.weekday)) {
        throw app.httpErrors.badRequest("Cada dia da semana deve aparecer apenas uma vez.");
      }
      seen.add(row.weekday);
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.businessHour.deleteMany({ where: { workspaceId: req.workspaceId } });
      await tx.businessHour.createMany({
        data: body.map((row) => ({
          workspaceId: req.workspaceId,
          weekday: row.weekday,
          startTime: row.startTime,
          endTime: row.endTime,
          isClosed: row.isClosed
        }))
      });
      await tx.workspace.update({
        where: { id: req.workspaceId },
        data: { onboardingStep: Math.max(2, body.some((row) => !row.isClosed) ? 2 : 1) }
      });
    });

    return prisma.businessHour.findMany({
      where: { workspaceId: req.workspaceId },
      orderBy: { weekday: "asc" }
    });
  });

  app.post("/me/closures", async (req) => {
    assertRole(req.membershipRole, "manager");
    const body = closureSchema.parse(req.body);
    return prisma.workspaceClosure.create({
      data: {
        workspaceId: req.workspaceId,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        reason: body.reason
      }
    });
  });

  app.post("/me/templates", async (req) => {
    assertRole(req.membershipRole, "manager");
    const body = z
      .object({
        channel: z.enum(["whatsapp", "email"]),
        type: z.string().min(2),
        templateName: z.string().min(2),
        language: z.string().default("pt_BR"),
        body: z.string().min(10),
        active: z.boolean().default(true)
      })
      .parse(req.body);

    return prisma.messageTemplate.upsert({
      where: {
        workspaceId_channel_type: {
          workspaceId: req.workspaceId,
          channel: body.channel,
          type: body.type
        }
      },
      update: body,
      create: {
        workspaceId: req.workspaceId,
        ...body
      }
    });
  });
};
