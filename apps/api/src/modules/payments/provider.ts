import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { addMinutes } from "date-fns";
import type { PaymentStatus } from "@prisma/client";
import { env } from "../../config/env.js";

export interface PaymentProvider {
  createPixCharge(input: {
    amount: number;
    description: string;
    payerName: string;
    payerEmail?: string;
    idempotencyKey?: string;
    externalReference?: string;
  }): Promise<{
    externalId: string;
    qrCode: string;
    pixCopyPaste: string;
    expiresAt?: Date;
    rawPayload: Record<string, unknown>;
  }>;
}

type MercadoPagoPaymentResponse = {
  id: string | number;
  status?: string;
  external_reference?: string;
  date_of_expiration?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
};

type MercadoPagoNotification = {
  action?: string;
  dataId: string;
};

export class MercadoPagoProvider implements PaymentProvider {
  async createPixCharge(input: {
    amount: number;
    description: string;
    payerName: string;
    payerEmail?: string;
    idempotencyKey?: string;
    externalReference?: string;
  }) {
    const id = `mp_${Date.now()}`;

    if (!env.MERCADO_PAGO_ENABLED || !env.MP_ACCESS_TOKEN) {
      return {
        externalId: id,
        qrCode: `data:image/png;base64,MOCK_${id}`,
        pixCopyPaste: `00020126${input.amount}${input.description}`,
        expiresAt: addMinutes(new Date(), 30),
        rawPayload: {
          mode: "mock",
          idempotencyKey: input.idempotencyKey,
          payerName: input.payerName,
          payerEmail: input.payerEmail,
          externalReference: input.externalReference
        }
      };
    }

    const expiresAt = addMinutes(new Date(), 30);
    const [firstName, ...rest] = input.payerName.trim().split(/\s+/);
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": input.idempotencyKey ?? randomUUID()
      },
      body: JSON.stringify({
        transaction_amount: Number((input.amount / 100).toFixed(2)),
        description: input.description,
        payment_method_id: "pix",
        notification_url: `${env.API_BASE_URL}/payments/webhook/mercadopago`,
        external_reference: input.externalReference ?? input.idempotencyKey ?? id,
        date_of_expiration: expiresAt.toISOString(),
        payer: {
          email: resolvePayerEmail(input.payerEmail, input.payerName),
          first_name: firstName || "Cliente",
          last_name: rest.join(" ") || undefined
        }
      })
    });

    if (!response.ok) {
      throw new Error(`MERCADO_PAGO_CREATE_PIX_FAILED:${response.status}`);
    }

    const body = (await response.json()) as MercadoPagoPaymentResponse;
    const transactionData = body.point_of_interaction?.transaction_data;

    if (!transactionData?.qr_code || !transactionData.qr_code_base64) {
      throw new Error("MERCADO_PAGO_INVALID_PIX_RESPONSE");
    }

    return {
      externalId: String(body.id),
      qrCode: `data:image/png;base64,${transactionData.qr_code_base64}`,
      pixCopyPaste: transactionData.qr_code,
      expiresAt: body.date_of_expiration ? new Date(body.date_of_expiration) : expiresAt,
      rawPayload: body as Record<string, unknown>
    };
  }

  async getPaymentDetails(paymentId: string) {
    if (!env.MP_ACCESS_TOKEN) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN_MISSING");
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`MERCADO_PAGO_GET_PAYMENT_FAILED:${response.status}`);
    }

    return (await response.json()) as MercadoPagoPaymentResponse;
  }
}

export function normalizeMercadoPagoNotification(input: {
  body: Record<string, unknown>;
  query: Record<string, unknown>;
}) {
  const bodyData = typeof input.body.data === "object" && input.body.data ? (input.body.data as Record<string, unknown>) : null;
  const bodyId = bodyData?.id ?? input.body.id;
  const queryId = input.query["data.id"] ?? input.query.id;
  const dataId = String(bodyId ?? queryId ?? "");

  if (!dataId) {
    return null;
  }

  return {
    action: typeof input.body.action === "string" ? input.body.action : undefined,
    dataId
  } satisfies MercadoPagoNotification;
}

export function mapMercadoPagoStatus(status?: string): PaymentStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "cancelled":
      return "cancelled";
    case "rejected":
      return "failed";
    case "refunded":
      return "refunded";
    case "expired":
      return "expired";
    default:
      return "pending";
  }
}

export function verifyMercadoPagoWebhookSignature(input: {
  dataId: string;
  signatureHeader?: string;
  requestIdHeader?: string;
  secret?: string;
}) {
  if (!input.secret) return true;
  if (!input.signatureHeader || !input.requestIdHeader || !input.dataId) return false;

  const parts = Object.fromEntries(
    input.signatureHeader
      .split(",")
      .map((entry) => entry.trim().split("="))
      .filter((entry) => entry.length === 2)
  );

  const ts = parts.ts;
  const version = parts.v1;

  if (!ts || !version) return false;

  const manifest = buildMercadoPagoWebhookManifest({
    dataId: input.dataId,
    requestIdHeader: input.requestIdHeader,
    ts
  });
  const digest = createHmac("sha256", input.secret).update(manifest).digest("hex");

  return timingSafeEqual(Buffer.from(digest), Buffer.from(version));
}

export function buildMercadoPagoWebhookManifest(input: {
  dataId: string;
  requestIdHeader: string;
  ts: string;
}) {
  return `id:${input.dataId};request-id:${input.requestIdHeader};ts:${input.ts};`;
}

function resolvePayerEmail(email: string | undefined, payerName: string) {
  if (email) return email;

  const normalized = payerName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");

  return `${normalized || "cliente"}@belezafoco.local`;
}
