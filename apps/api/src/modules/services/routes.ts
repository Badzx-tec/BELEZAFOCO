import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { assertRole } from "../../lib/permissions.js";
import { slugify } from "../../lib/slug.js";
import { writeAudit } from "../../lib/audit.js";

const serviceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().max(500).optional().nullable(),
  category: z.string().min(2),
  durationMinutes: z.number().int().positive(),
  prepMinutes: z.number().int().min(0).default(0),
  finishMinutes: z.number().int().min(0).default(0),
  bufferBeforeMinutes: z.number().int().min(0).default(0),
  bufferAfterMinutes: z.number().int().min(0).default(0),
  priceType: z.enum(["fixed", "starts_at", "varies", "free"]).default("fixed"),
  priceValue: z.number().int().min(0).optional().nullable(),
  depositEnabled: z.boolean().default(false),
  depositType: z.enum(["percent", "fixed"]).optional().nullable(),
  depositValue: z.number().int().min(0).optional().nullable(),
  requiredResourceId: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true)
});

export const serviceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/services", async (req) =>
    prisma.service.findMany({
      where: { workspaceId: req.workspaceId },
      include: { requiredResource: true, staffServices: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }]
    })
  );

  app.post("/me/services", async (req) => {
    assertRole(req.membershipRole, "manager");
    const body = serviceSchema.parse(req.body);
    const slug = slugify(body.slug ?? body.name);
    let requiredResourceId: string | null = null;

    if (body.requiredResourceId) {
      const resource = await prisma.resource.findFirst({
        where: {
          id: body.requiredResourceId,
          workspaceId: req.workspaceId,
          active: true
        }
      });

      if (!resource) {
        throw app.httpErrors.notFound("Recurso obrigatorio nao encontrado neste workspace.");
      }

      requiredResourceId = resource.id;
    }

    const service = await prisma.service.create({
      data: {
        workspaceId: req.workspaceId,
        ...body,
        slug,
        requiredResourceId,
        depositType: body.depositEnabled ? body.depositType ?? "fixed" : null,
        depositValue: body.depositEnabled ? body.depositValue ?? 0 : null
      }
    });

    await prisma.workspace.update({
      where: { id: req.workspaceId },
      data: { onboardingStep: 3 }
    });

    await writeAudit({
      workspaceId: req.workspaceId,
      actorUserId: req.userId,
      action: "service.created",
      entityType: "service",
      entityId: service.id,
      payload: body
    });

    return service;
  });
};
