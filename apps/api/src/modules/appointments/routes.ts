import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { writeAudit } from "../../lib/audit.js";
import { createAppointment, releaseAppointmentCapacity } from "../../lib/booking.js";
import { assertRole } from "../../lib/permissions.js";

const appointmentCreateSchema = z.object({
  serviceId: z.string(),
  staffMemberId: z.string(),
  clientId: z.string(),
  startAt: z.string(),
  notesClient: z.string().optional(),
  notesInternal: z.string().optional()
});

export const appointmentRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/appointments", async (req) =>
    prisma.appointment.findMany({
      where: { workspaceId: req.workspaceId },
      include: { service: true, client: true, staffMember: true, resource: true, payments: true },
      orderBy: { startAt: "asc" }
    })
  );

  app.post("/me/appointments", async (req) => {
    assertRole(req.membershipRole, "receptionist");
    const body = appointmentCreateSchema.parse(req.body);
    const created = await createAppointment({
      workspaceId: req.workspaceId,
      serviceId: body.serviceId,
      staffMemberId: body.staffMemberId,
      clientId: body.clientId,
      startAt: new Date(body.startAt),
      source: "admin",
      notesClient: body.notesClient,
      notesInternal: body.notesInternal,
      idempotencyKey: `admin:${req.workspaceId}:${body.clientId}:${body.startAt}:${body.serviceId}`
    });

    await writeAudit({
      workspaceId: req.workspaceId,
      actorUserId: req.userId,
      action: "appointment.created",
      entityType: "appointment",
      entityId: created.appointment.id,
      payload: body
    });

    return created;
  });

  app.patch("/me/appointments/:id/status", async (req) => {
    assertRole(req.membershipRole, "receptionist");
    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        status: z.enum(["confirmed", "cancelled", "rescheduled", "done", "no_show", "late_cancel"]),
        cancelledReason: z.string().optional()
      })
      .parse(req.body);

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        workspaceId: req.workspaceId
      }
    });

    if (!appointment) {
      throw app.httpErrors.notFound("Agendamento nao encontrado.");
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: body.status,
        confirmedAt: body.status === "confirmed" ? new Date() : appointment.confirmedAt,
        cancelledAt: ["cancelled", "late_cancel", "rescheduled"].includes(body.status) ? new Date() : appointment.cancelledAt,
        cancelledReason: body.cancelledReason ?? appointment.cancelledReason,
        completedAt: body.status === "done" ? new Date() : appointment.completedAt,
        noShowMarkedAt: body.status === "no_show" ? new Date() : appointment.noShowMarkedAt
      }
    });

    if (["cancelled", "late_cancel", "rescheduled"].includes(body.status)) {
      await releaseAppointmentCapacity(appointment.id);
    }

    await writeAudit({
      workspaceId: req.workspaceId,
      actorUserId: req.userId,
      action: `appointment.${body.status}`,
      entityType: "appointment",
      entityId: appointment.id,
      payload: body
    });

    return updated;
  });

  app.get("/me/appointments/export.csv", async (req, reply) => {
    const list = await prisma.appointment.findMany({
      where: { workspaceId: req.workspaceId },
      include: { client: true, service: true, staffMember: true },
      orderBy: { startAt: "asc" }
    });
    const csv = [
      "id,startAt,status,cliente,servico,profissional",
      ...list.map((appointment) =>
        `${appointment.id},${appointment.startAt.toISOString()},${appointment.status},${escapeCsv(appointment.client.name)},${escapeCsv(appointment.service.name)},${escapeCsv(appointment.staffMember.name)}`
      )
    ].join("\n");
    reply.header("content-type", "text/csv; charset=utf-8");
    return csv;
  });
};

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
