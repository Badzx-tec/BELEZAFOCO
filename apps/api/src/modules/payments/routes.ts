import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { MercadoPagoProvider, type NormalizedPaymentStatus } from "./provider.js";
import { verifyMercadoPagoWebhookSignature, verifySharedWebhookSecret } from "./webhook-security.js";
import { syncAppointmentFinancialEntry } from "../finance/service.js";

function normalizeIncomingStatus(status?: string | null): NormalizedPaymentStatus {
  switch (status) {
    case "approved":
    case "paid":
      return "paid" as const;
    case "refunded":
      return "refunded" as const;
    case "failed":
    case "cancelled":
    case "rejected":
      return "failed" as const;
    default:
      return "pending" as const;
  }
}

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/payments/webhook/mercadopago", async (req, reply) => {
    const query = z
      .object({
        "data.id": z.string().optional(),
        type: z.string().optional()
      })
      .passthrough()
      .parse(req.query ?? {});

    const body = z
      .object({
        id: z.union([z.string(), z.number()]).transform(String).optional(),
        eventId: z.string().optional(),
        externalId: z.string().optional(),
        status: z.string().optional(),
        action: z.string().optional(),
        type: z.string().optional(),
        data: z
          .object({
            id: z.union([z.string(), z.number()]).transform(String).optional()
          })
          .optional()
      })
      .passthrough()
      .parse(req.body);

    const notificationDataId = query["data.id"] ?? body.data?.id ?? body.externalId;
    const hasOfficialSignature = typeof req.headers["x-signature"] === "string";

    const isMercadoPagoSignatureValid = hasOfficialSignature
      ? verifyMercadoPagoWebhookSignature({
          secret: env.MP_WEBHOOK_SECRET,
          signatureHeader: req.headers["x-signature"],
          requestIdHeader: req.headers["x-request-id"],
          dataId: notificationDataId
        })
      : false;
    const isFallbackSecretValid = !hasOfficialSignature
      ? verifySharedWebhookSecret({
          expectedSecret: env.MP_WEBHOOK_SECRET,
          providedSecret: req.headers["x-webhook-secret"]
        })
      : false;

    if (env.MP_WEBHOOK_SECRET && !isMercadoPagoSignatureValid && !isFallbackSecretValid) {
      throw app.httpErrors.forbidden("Webhook invalido");
    }

    let paymentSnapshot:
      | {
          externalId: string;
          status: "pending" | "paid" | "failed" | "refunded";
          statusDetail?: string | null;
          qrCode: string;
          pixCopyPaste: string;
          expiresAt?: Date | null;
          providerPayload?: string | null;
        }
      | null = null;

    if (body.externalId && body.status) {
      paymentSnapshot = {
        externalId: body.externalId,
        status: normalizeIncomingStatus(body.status),
        statusDetail: body.status,
        qrCode: "",
        pixCopyPaste: "",
        expiresAt: null,
        providerPayload: JSON.stringify({
          query,
          body
        })
      };
    } else if (notificationDataId) {
      const provider = new MercadoPagoProvider();
      const remotePayment = await provider.getPayment(notificationDataId);
      paymentSnapshot = {
        externalId: remotePayment.externalId,
        status: remotePayment.status,
        statusDetail: remotePayment.statusDetail,
        qrCode: remotePayment.qrCode,
        pixCopyPaste: remotePayment.pixCopyPaste,
        expiresAt: remotePayment.expiresAt,
        providerPayload: remotePayment.providerPayload
      };
    }

    if (!paymentSnapshot?.externalId) {
      throw app.httpErrors.badRequest("externalId ausente");
    }

    const eventId =
      typeof req.headers["x-webhook-id"] === "string"
        ? req.headers["x-webhook-id"]
        : typeof req.headers["x-request-id"] === "string"
          ? req.headers["x-request-id"]
          : body.eventId ?? body.id ?? `${paymentSnapshot.externalId}:${paymentSnapshot.status}`;

    try {
      await prisma.webhookEvent.create({
        data: {
          provider: "mercado_pago",
          eventId,
          status: "received",
          payload: JSON.stringify({
            query,
            body,
            paymentSnapshot
          })
        }
      });
    } catch {
      reply.code(200);
      return { ok: true, duplicate: true };
    }

    const payment = await prisma.payment.findFirstOrThrow({
      where: { externalId: paymentSnapshot.externalId },
      include: { appointment: true }
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentSnapshot.status,
          qrCode: paymentSnapshot.qrCode || payment.qrCode,
          pixCopyPaste: paymentSnapshot.pixCopyPaste || payment.pixCopyPaste,
          expiresAt: paymentSnapshot.expiresAt ?? payment.expiresAt,
          confirmedAt: paymentSnapshot.status === "paid" ? new Date() : payment.confirmedAt,
          providerPayload: paymentSnapshot.providerPayload ?? JSON.stringify({ query, body })
        }
      });

      if (paymentSnapshot.status === "paid") {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: "confirmed",
            depositStatus: "paid",
            confirmedAt: payment.appointment.confirmedAt ?? new Date(),
            cancelledAt: null
          }
        });
      } else if (paymentSnapshot.status === "pending") {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: "pending_payment",
            depositStatus: "pending",
            paymentExpiresAt: paymentSnapshot.expiresAt ?? payment.appointment.paymentExpiresAt
          }
        });
      } else if (paymentSnapshot.status === "failed") {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: payment.appointment.status === "pending_payment" ? "cancelled" : payment.appointment.status,
            depositStatus: "failed",
            cancelledAt: payment.appointment.status === "pending_payment" ? new Date() : payment.appointment.cancelledAt
          }
        });
      } else {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            depositStatus: "refunded"
          }
        });
      }

      await syncAppointmentFinancialEntry(tx, payment.appointmentId);

      await tx.webhookEvent.update({
        where: { provider_eventId: { provider: "mercado_pago", eventId } },
        data: { status: "processed" }
      });
    });

    return { ok: true };
  });
};
