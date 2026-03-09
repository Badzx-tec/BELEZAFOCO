import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { requireRole } from "../../lib/permissions.js";

export const clientRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/clients", async (req) => {
    requireRole(app, req, ["staff"]);
    const clients = await prisma.client.findMany({
      where: { workspaceId: req.workspaceId },
      include: {
        appointments: {
          include: { service: true },
          orderBy: { startAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return clients.map((client) => ({
      ...client,
      lastVisitAt: client.appointments[0]?.startAt ?? null,
      visitsCount: client.appointments.length,
      recurring: client.appointments.length >= 2
    }));
  });
};
