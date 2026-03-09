import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { requireRole } from "../../lib/permissions.js";

export const resourceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/resources", async (req) => {
    requireRole(app, req, ["staff"]);
    return prisma.resource.findMany({
      where: { workspaceId: req.workspaceId },
      orderBy: { name: "asc" }
    });
  });

  app.post("/me/resources", async (req) => {
    requireRole(app, req, ["manager"]);
    const body = z
      .object({
        name: z.string().min(2),
        type: z.string().min(2),
        active: z.boolean().default(true)
      })
      .parse(req.body);

    return prisma.resource.create({ data: { ...body, workspaceId: req.workspaceId } });
  });
};
