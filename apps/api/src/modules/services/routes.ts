import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { requireRole } from "../../lib/permissions.js";

const schema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().positive(),
  prepMinutes: z.number().int().min(0).default(0),
  finishingMinutes: z.number().int().min(0).default(0),
  bufferBeforeMinutes: z.number().int().min(0).default(0),
  bufferAfterMinutes: z.number().int().min(0).default(0),
  priceType: z.enum(["fixed", "starts_at", "varies", "free"]),
  priceValue: z.number().int().optional().nullable(),
  depositEnabled: z.boolean().default(false),
  depositType: z.enum(["percent", "fixed"]).optional().nullable(),
  depositValue: z.number().int().optional().nullable(),
  requiredResourceId: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  onlineBookingEnabled: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true)
});

export const serviceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/services", async (req) => {
    requireRole(app, req, ["staff"]);
    return prisma.service.findMany({
      where: { workspaceId: req.workspaceId },
      include: { staffServices: true, requiredResource: true },
      orderBy: [{ featured: "desc" }, { displayOrder: "asc" }, { name: "asc" }]
    });
  });

  app.post("/me/services", async (req) => {
    requireRole(app, req, ["manager"]);
    const body = schema.parse(req.body);
    return prisma.service.create({
      data: {
        ...body,
        workspaceId: req.workspaceId
      }
    });
  });
};
