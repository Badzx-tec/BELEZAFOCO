import { randomUUID } from "node:crypto";
import { addMinutes } from "date-fns";
import { env } from "../../config/env.js";

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com";

type MercadoPagoPaymentResponse = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  date_of_expiration?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string | null;
      qr_code_base64?: string | null;
      ticket_url?: string | null;
    } | null;
  } | null;
};

export type NormalizedPaymentStatus = "pending" | "paid" | "failed" | "refunded";

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
    ticketUrl?: string | null;
    expiresAt?: Date | null;
    idempotencyKey?: string | null;
    providerPayload?: string | null;
  }>;
  getPayment(externalId: string): Promise<{
    externalId: string;
    status: "pending" | "paid" | "failed" | "refunded";
    statusDetail?: string | null;
    qrCode: string;
    pixCopyPaste: string;
    ticketUrl?: string | null;
    expiresAt?: Date | null;
    providerPayload?: string | null;
  }>;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "Cliente", lastName: "BELEZAFOCO" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || "BELEZAFOCO"
  };
}

function resolvePayerEmail(payerEmail?: string) {
  const cleaned = payerEmail?.trim().toLowerCase();
  if (cleaned) return cleaned;
  return `cliente-${Date.now()}@belezafoco.app`;
}

function buildNotificationUrl() {
  try {
    const baseUrl = new URL(env.API_BASE_URL ?? env.PUBLIC_URL);
    if (baseUrl.protocol !== "https:") return undefined;
    if (["localhost", "127.0.0.1"].includes(baseUrl.hostname)) return undefined;
    return new URL("/payments/webhook/mercadopago", baseUrl).toString();
  } catch {
    return undefined;
  }
}

function buildQrCodeDataUri(base64?: string | null) {
  if (!base64) return "";
  return `data:image/png;base64,${base64}`;
}

function normalizeMercadoPagoStatus(status?: string | null): NormalizedPaymentStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "cancelled":
    case "rejected":
      return "failed";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}

async function mercadoPagoRequest<T>(path: string, init: RequestInit) {
  if (!env.MP_ACCESS_TOKEN) {
    throw new Error("Mercado Pago nao configurado");
  }

  const response = await fetch(`${MERCADO_PAGO_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    signal: AbortSignal.timeout(10_000)
  });

  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const details =
      payload?.message ??
      payload?.cause?.[0]?.description ??
      payload?.error ??
      raw ??
      "erro desconhecido";
    throw new Error(`Mercado Pago ${response.status}: ${details}`);
  }

  return payload as T;
}

function mapPixPayload(payload: MercadoPagoPaymentResponse): {
  externalId: string;
  status: NormalizedPaymentStatus;
  statusDetail: string | null;
  qrCode: string;
  pixCopyPaste: string;
  ticketUrl: string | null;
  expiresAt: Date | null;
  providerPayload: string;
} {
  const transactionData = payload.point_of_interaction?.transaction_data;

  return {
    externalId: String(payload.id ?? ""),
    status: normalizeMercadoPagoStatus(payload.status),
    statusDetail: payload.status_detail ?? null,
    qrCode: buildQrCodeDataUri(transactionData?.qr_code_base64),
    pixCopyPaste: transactionData?.qr_code ?? "",
    ticketUrl: transactionData?.ticket_url ?? null,
    expiresAt: payload.date_of_expiration ? new Date(payload.date_of_expiration) : null,
    providerPayload: JSON.stringify(payload)
  };
}

export class MercadoPagoProvider implements PaymentProvider {
  async createPixCharge(input: {
    amount: number;
    description: string;
    payerName: string;
    payerEmail?: string;
    idempotencyKey?: string;
    externalReference?: string;
  }) {
    const idempotencyKey = input.idempotencyKey ?? randomUUID();
    const expirationDate = addMinutes(new Date(), 30);
    const { firstName, lastName } = splitName(input.payerName);
    const notificationUrl = buildNotificationUrl();

    const payload = await mercadoPagoRequest<MercadoPagoPaymentResponse>("/v1/payments", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({
        transaction_amount: Number((input.amount / 100).toFixed(2)),
        description: input.description,
        payment_method_id: "pix",
        date_of_expiration: expirationDate.toISOString(),
        payer: {
          email: resolvePayerEmail(input.payerEmail),
          first_name: firstName,
          last_name: lastName
        },
        ...(input.externalReference ? { external_reference: input.externalReference } : {}),
        ...(notificationUrl ? { notification_url: notificationUrl } : {})
      })
    });

    const pixPayload = mapPixPayload(payload);
    if (!pixPayload.externalId || !pixPayload.pixCopyPaste) {
      throw new Error("Mercado Pago nao retornou dados Pix suficientes");
    }

    return {
      externalId: pixPayload.externalId,
      qrCode: pixPayload.qrCode,
      pixCopyPaste: pixPayload.pixCopyPaste,
      ticketUrl: pixPayload.ticketUrl,
      expiresAt: pixPayload.expiresAt ?? expirationDate,
      idempotencyKey,
      providerPayload: pixPayload.providerPayload
    };
  }

  async getPayment(externalId: string) {
    const payload = await mercadoPagoRequest<MercadoPagoPaymentResponse>(`/v1/payments/${externalId}`, {
      method: "GET"
    });

    const pixPayload = mapPixPayload(payload);
    if (!pixPayload.externalId) {
      throw new Error("Mercado Pago nao retornou o identificador do pagamento");
    }

    return pixPayload;
  }
}
