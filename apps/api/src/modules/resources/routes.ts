import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";

export const resourceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/resources", async (req) => prisma.resource.findMany({ where: { workspaceId: req.workspaceId } }));
  app.post("/me/resources", async (req) => {
    const body = z.object({ name: z.string(), type: z.string() }).parse(req.body);
    return prisma.resource.create({ data: { ...body, workspaceId: req.workspaceId } });
  });
};
