import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

export const clientRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/clients", async (req) => {
    const clients = await prisma.client.findMany({
      where: { workspaceId: req.workspaceId },
      include: {
        appointments: {
          orderBy: { startAt: "desc" },
          take: 5,
          include: { service: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return clients.map((client) => ({
      ...client,
      stats: {
        totalAppointments: client.appointments.length,
        lastVisitAt: client.appointments[0]?.startAt ?? null,
        recurring: client.appointments.length >= 3
      }
    }));
  });
};
