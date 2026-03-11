import { FastifyPluginAsync, FastifyInstance, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { MercadoPagoProvider, mapMercadoPagoStatus, normalizeMercadoPagoNotification, verifyMercadoPagoWebhookSignature } from "./provider.js";

const mockWebhookSchema = z.object({
  eventId: z.string().min(4),
  externalId: z.string(),
  status: z.enum(["paid", "failed", "expired"]),
  appointmentId: z.string().optional()
});

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/payments/webhook/mercadopago", async (req) => {
    const parsedMockPayload = mockWebhookSchema.safeParse(req.body);
    if (parsedMockPayload.success) {
      return applyMockWebhook(app, req, parsedMockPayload.data);
    }

    const normalizedNotification = normalizeMercadoPagoNotification({
      body: (req.body as Record<string, unknown>) ?? {},
      query: (req.query as Record<string, unknown>) ?? {}
    });

    if (!normalizedNotification) {
      throw app.httpErrors.badRequest("Payload de webhook do Mercado Pago invalido.");
    }

    const signatureHeader = typeof req.headers["x-signature"] === "string" ? req.headers["x-signature"] : undefined;
    const requestIdHeader = typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"] : undefined;
    if (
      !verifyMercadoPagoWebhookSignature({
        dataId: normalizedNotification.dataId,
        signatureHeader,
        requestIdHeader,
        secret: env.MP_WEBHOOK_SECRET
      })
    ) {
      throw app.httpErrors.unauthorized("Assinatura do webhook do Mercado Pago invalida.");
    }

    const existingEvent = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventType_externalId: {
          provider: "mercado_pago",
          eventType: normalizedNotification.action ?? "payment.updated",
          externalId: normalizedNotification.dataId
        }
      }
    });

    if (existingEvent) {
      return { ok: true, duplicated: true };
    }

    const provider = new MercadoPagoProvider();
    const details = await provider.getPaymentDetails(normalizedNotification.dataId);
    const mappedStatus = mapMercadoPagoStatus(details.status);
    const payment = await prisma.payment.findFirstOrThrow({
      where: {
        externalId: String(details.id)
      },
      include: {
        appointment: true
      }
    });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.webhookEvent.create({
        data: {
          workspaceId: payment.appointment.workspaceId,
          provider: "mercado_pago",
          eventType: normalizedNotification.action ?? "payment.updated",
          externalId: normalizedNotification.dataId,
          signature: signatureHeader,
          payload: req.body as never,
          processedAt: new Date()
        }
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: mappedStatus,
          paidAt: mappedStatus === "paid" ? new Date() : null,
          providerPayload: details as never
        }
      });

      if (mappedStatus === "paid") {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: "confirmed",
            depositStatus: "paid",
            confirmedAt: new Date()
          }
        });
      }

      if (mappedStatus === "expired" || mappedStatus === "cancelled") {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: "cancelled",
            depositStatus: mappedStatus,
            cancelledAt: new Date(),
            cancelledReason: "Pagamento PIX expirado ou cancelado"
          }
        });
        await tx.appointmentSegment.deleteMany({
          where: { appointmentId: payment.appointmentId }
        });
      }
    });

    return { ok: true, providerStatus: details.status, status: mappedStatus };
  });
};

async function applyMockWebhook(
  app: FastifyInstance,
  req: FastifyRequest,
  body: z.infer<typeof mockWebhookSchema>
) {
  if (env.MP_WEBHOOK_SECRET) {
    const providedSecret = req.headers["x-webhook-secret"];
    if (providedSecret !== env.MP_WEBHOOK_SECRET) {
      throw app.httpErrors.unauthorized("Webhook nao autorizado.");
    }
  }

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
}
