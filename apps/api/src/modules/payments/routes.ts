import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { z } from "zod";

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/payments/webhook/mercadopago", async (req, reply) => {
    const body = z
      .object({
        eventId: z.string().optional(),
        externalId: z.string(),
        status: z.enum(["paid", "failed"])
      })
      .parse(req.body);

    const providedSecret = req.headers["x-webhook-secret"];
    if (env.MP_WEBHOOK_SECRET && providedSecret !== env.MP_WEBHOOK_SECRET) {
      throw app.httpErrors.forbidden("Webhook inválido");
    }

    const eventId = typeof req.headers["x-webhook-id"] === "string"
      ? req.headers["x-webhook-id"]
      : body.eventId ?? `${body.externalId}:${body.status}`;

    try {
      await prisma.webhookEvent.create({
        data: {
          provider: "mercado_pago",
          eventId,
          status: "received",
          payload: JSON.stringify(body)
        }
      });
    } catch {
      reply.code(200);
      return { ok: true, duplicate: true };
    }

    const payment = await prisma.payment.findFirstOrThrow({
      where: { externalId: body.externalId },
      include: { appointment: true }
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: body.status,
          confirmedAt: body.status === "paid" ? new Date() : undefined,
          providerPayload: JSON.stringify(body)
        }
      });

      await tx.appointment.update({
        where: { id: payment.appointmentId },
        data:
          body.status === "paid"
            ? {
                status: "confirmed",
                depositStatus: "paid",
                confirmedAt: new Date()
              }
            : {
                status: "cancelled",
                depositStatus: "failed",
                cancelledAt: new Date()
              }
      });

      await tx.webhookEvent.update({
        where: { provider_eventId: { provider: "mercado_pago", eventId } },
        data: { status: "processed" }
      });
    });

    return { ok: true };
  });
};
