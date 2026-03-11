import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { verifyWhatsAppWebhookSignature } from "./webhook-security.js";

function buildWebhookEventId(entryId: string, change: Record<string, unknown>) {
  const value = (change.value ?? {}) as {
    statuses?: Array<{ id?: string | null }>;
    messages?: Array<{ id?: string | null }>;
  };

  const providerEventId = value.statuses?.[0]?.id ?? value.messages?.[0]?.id;
  return `${entryId}:${providerEventId ?? String(change.field ?? "event")}`;
}

export const messagingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/messaging/webhooks/whatsapp", async (req, reply) => {
    const query = z
      .object({
        "hub.mode": z.string().optional(),
        "hub.verify_token": z.string().optional(),
        "hub.challenge": z.string().optional()
      })
      .parse(req.query);

    if (
      query["hub.mode"] === "subscribe" &&
      env.WHATSAPP_CLOUD_API_VERIFY_TOKEN &&
      query["hub.verify_token"] === env.WHATSAPP_CLOUD_API_VERIFY_TOKEN &&
      query["hub.challenge"]
    ) {
      reply.type("text/plain");
      return query["hub.challenge"];
    }

    throw app.httpErrors.forbidden("Webhook do WhatsApp invalido");
  });

  app.post("/messaging/webhooks/whatsapp", async (req) => {
    const body = z
      .object({
        object: z.string().optional(),
        entry: z.array(z.record(z.unknown())).default([])
      })
      .passthrough()
      .parse(req.body ?? {});

    const rawBody = JSON.stringify(req.body ?? {});
    const signature = req.headers["x-hub-signature-256"];
    const signatureValid = verifyWhatsAppWebhookSignature({
      appSecret: env.WHATSAPP_CLOUD_API_APP_SECRET,
      rawBody,
      signatureHeader: signature
    });

    if (!signatureValid) {
      throw app.httpErrors.forbidden("Assinatura invalida do webhook do WhatsApp");
    }

    for (const entry of body.entry) {
      const entryId = typeof entry.id === "string" ? entry.id : "entry";
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const rawChange of changes) {
        const change = rawChange as Record<string, unknown>;
        const eventId = buildWebhookEventId(entryId, change);

        try {
          await prisma.webhookEvent.create({
            data: {
              provider: "whatsapp_cloud_api",
              eventId,
              status: "received",
              payload: JSON.stringify({
                object: body.object,
                entryId,
                change
              })
            }
          });
        } catch {
          continue;
        }
      }
    }

    return { ok: true };
  });
};
