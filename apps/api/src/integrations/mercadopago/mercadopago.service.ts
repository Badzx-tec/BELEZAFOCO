import { Injectable, Logger } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";

interface MpPixResponse {
  id: number;
  status: string;
  date_of_expiration: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
}

export interface PixPaymentResult {
  externalPaymentId: string;
  status: string;
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  expiresAt: Date | null;
  raw: MpPixResponse;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly baseUrl = "https://api.mercadopago.com";

  private get accessToken(): string | undefined {
    return process.env.MP_ACCESS_TOKEN;
  }

  private get webhookSecret(): string | undefined {
    return process.env.MP_WEBHOOK_SECRET;
  }

  async createPixPayment(params: {
    idempotencyKey: string;
    amountCents: number;
    payerEmail: string;
    description: string;
  }): Promise<PixPaymentResult> {
    const token = this.accessToken;
    if (!token) throw new Error("MP_ACCESS_TOKEN is not configured");

    const body = {
      transaction_amount: params.amountCents / 100,
      payment_method_id: "pix",
      payer: { email: params.payerEmail },
      description: params.description
    };

    const res = await fetch(`${this.baseUrl}/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": params.idempotencyKey
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`MP createPixPayment failed: ${res.status} ${text}`);
      throw new Error(`Mercado Pago API error: ${res.status}`);
    }

    const data = (await res.json()) as MpPixResponse;
    const txData = data.point_of_interaction?.transaction_data;

    return {
      externalPaymentId: String(data.id),
      status: data.status,
      pixQrCode: txData?.qr_code_base64 ?? null,
      pixCopyPaste: txData?.qr_code ?? null,
      expiresAt: data.date_of_expiration ? new Date(data.date_of_expiration) : null,
      raw: data
    };
  }

  async getPaymentStatus(externalPaymentId: string): Promise<{ status: string; raw: object }> {
    const token = this.accessToken;
    if (!token) throw new Error("MP_ACCESS_TOKEN is not configured");

    const res = await fetch(`${this.baseUrl}/v1/payments/${externalPaymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Mercado Pago API error: ${res.status}`);
    const data = (await res.json()) as { status: string };
    return { status: data.status, raw: data as object };
  }

  validateWebhookSignature(params: {
    ts: string;
    v1: string;
    dataId: string;
    requestId: string;
  }): boolean {
    const secret = this.webhookSecret;
    if (!secret) {
      this.logger.warn("MP_WEBHOOK_SECRET not set — skipping signature validation");
      return true; // allow in dev, but log warning
    }
    const manifest = `id:${params.dataId};request-id:${params.requestId};ts:${params.ts};`;
    const expected = createHmac("sha256", secret).update(manifest).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(params.v1));
    } catch {
      return false;
    }
  }
}
