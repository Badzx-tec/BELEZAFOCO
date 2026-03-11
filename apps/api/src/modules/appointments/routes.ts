import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { writeAudit } from "../../lib/audit.js";
import { requireRole } from "../../lib/permissions.js";

const activeStatuses = ["requested", "pending_payment", "confirmed", "done", "no_show", "late_cancel"] as const;

export const appointmentRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/appointments", async (req) => {
    requireRole(app, req, ["staff"]);
    const query = z
      .object({
        from: z.string().optional(),
        to: z.string().optional(),
        status: z.enum(activeStatuses).optional()
      })
      .parse(req.query);

    return prisma.appointment.findMany({
      where: {
        workspaceId: req.workspaceId,
        ...(query.from || query.to
          ? {
              startAt: query.to ? { lte: new Date(query.to) } : undefined,
              endAt: query.from ? { gte: new Date(query.from) } : undefined
            }
          : {}),
        ...(query.status ? { status: query.status } : {})
      },
      include: {
        service: true,
        client: true,
        staffMember: true,
        resource: true,
        payments: true
      },
      orderBy: { startAt: "asc" }
    });
  });

  app.patch("/me/appointments/:id/status", async (req) => {
    requireRole(app, req, ["receptionist"]);
    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        status: z.enum(["confirmed", "cancelled", "rescheduled", "done", "no_show", "late_cancel"]),
        internalNotes: z.string().optional()
      })
      .parse(req.body);

    const appointment = await prisma.appointment.update({
      where: { id: params.id, workspaceId: req.workspaceId },
      data: {
        status: body.status,
        internalNotes: body.internalNotes,
        confirmedAt: body.status === "confirmed" ? new Date() : undefined,
        cancelledAt: body.status === "cancelled" || body.status === "late_cancel" ? new Date() : undefined
      }
    });

    await writeAudit({
      workspaceId: req.workspaceId,
      actorUserId: (req.user as any).sub,
      action: `appointment.${body.status}`,
      entityType: "appointment",
      entityId: appointment.id,
      payload: body
    });

    return appointment;
  });

  app.get("/me/appointments/export.csv", async (req, reply) => {
    requireRole(app, req, ["receptionist"]);
    const list = await prisma.appointment.findMany({
      where: { workspaceId: req.workspaceId },
      include: { client: true, service: true, staffMember: true, resource: true }
    });

    const csv = [
      "id,startAt,endAt,status,cliente,telefone,servico,profissional,recurso,valor",
      ...list.map((item) =>
        [
          item.id,
          item.startAt.toISOString(),
          item.endAt.toISOString(),
          item.status,
          item.client.name,
          item.client.whatsapp,
          item.service.name,
          item.staffMember.name,
          item.resource?.name ?? "",
          item.service.priceValue ?? ""
        ].join(",")
      )
    ].join("\n");

    reply.header("content-type", "text/csv");
    return csv;
  });
};
