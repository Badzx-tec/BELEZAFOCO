import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

export const clientRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/clients", async (req) => prisma.client.findMany({ where: { workspaceId: req.workspaceId }, include: { appointments: true } }));
};
