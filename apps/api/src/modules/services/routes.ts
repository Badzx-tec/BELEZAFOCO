import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  category: z.string(),
  durationMinutes: z.number().int().positive(),
  bufferBeforeMinutes: z.number().int().default(0),
  bufferAfterMinutes: z.number().int().default(0),
  priceType: z.enum(["fixed", "starts_at", "varies", "free"]),
  priceValue: z.number().int().optional(),
  depositEnabled: z.boolean().default(false),
  depositType: z.enum(["percent", "fixed"]).optional(),
  depositValue: z.number().int().optional(),
  requiredResourceId: z.string().optional(),
  active: z.boolean().default(true)
});

export const serviceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/services", async (req) => prisma.service.findMany({ where: { workspaceId: req.workspaceId } }));
  app.post("/me/services", async (req) => prisma.service.create({ data: { ...schema.parse(req.body), workspaceId: req.workspaceId } }));
};
