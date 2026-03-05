import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { writeAudit } from "../../lib/audit.js";

export const appointmentRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/appointments", async (req) => prisma.appointment.findMany({ where: { workspaceId: req.workspaceId }, include: { service: true, client: true, staffMember: true }, orderBy: { startAt: "asc" } }));

  app.patch("/me/appointments/:id/status", async (req) => {
    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ status: z.enum(["confirmed", "cancelled", "rescheduled", "done", "no_show", "late_cancel"]) }).parse(req.body);
    const appt = await prisma.appointment.update({ where: { id: params.id, workspaceId: req.workspaceId }, data: { status: body.status } });
    await writeAudit({ workspaceId: req.workspaceId, actorUserId: (req.user as any).sub, action: `appointment.${body.status}`, entityType: "appointment", entityId: appt.id, payload: body });
    return appt;
  });

  app.get("/me/appointments/export.csv", async (req, reply) => {
    const list = await prisma.appointment.findMany({ where: { workspaceId: req.workspaceId }, include: { client: true, service: true, staffMember: true } });
    const csv = ["id,startAt,status,cliente,servico,profissional", ...list.map((a) => `${a.id},${a.startAt.toISOString()},${a.status},${a.client.name},${a.service.name},${a.staffMember.name}`)].join("\n");
    reply.header("content-type", "text/csv");
    return csv;
  });
};
