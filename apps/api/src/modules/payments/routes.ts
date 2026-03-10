import { FastifyPluginAsync } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/payments/webhook/mercadopago", async (req) => {
    if (env.MP_WEBHOOK_SECRET) {
      const providedSecret = req.headers["x-webhook-secret"];
      if (providedSecret !== env.MP_WEBHOOK_SECRET) {
        throw app.httpErrors.unauthorized("Webhook nao autorizado.");
      }
    }

    const body = z
      .object({
        eventId: z.string().min(4),
        externalId: z.string(),
        status: z.enum(["paid", "failed", "expired"]),
        appointmentId: z.string().optional()
      })
      .parse(req.body);

    const existingEvent = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventType_externalId: {
          provider: "mercado_pago",
          eventType: body.status,
          externalId: body.eventId
        }
      }
    });

    if (existingEvent) {
      return { ok: true, duplicated: true };
    }

    const payment = await prisma.payment.findFirstOrThrow({
      where: { externalId: body.externalId },
      include: { appointment: true }
    });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.webhookEvent.create({
        data: {
          workspaceId: payment.appointment.workspaceId,
          provider: "mercado_pago",
          eventType: body.status,
          externalId: body.eventId,
          signature: typeof req.headers["x-webhook-secret"] === "string" ? req.headers["x-webhook-secret"] : undefined,
          payload: body as never,
          processedAt: new Date()
        }
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: body.status,
          paidAt: body.status === "paid" ? new Date() : null,
          providerPayload: body as never
        }
      });

      if (body.status === "paid") {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: "confirmed",
            depositStatus: "paid",
            confirmedAt: new Date()
          }
        });
      }

      if (body.status === "expired") {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: "cancelled",
            depositStatus: "expired",
            cancelledAt: new Date(),
            cancelledReason: "Pagamento PIX expirado"
          }
        });
        await tx.appointmentSegment.deleteMany({
          where: { appointmentId: payment.appointmentId }
        });
      }
    });

    return { ok: true };
  });
};
