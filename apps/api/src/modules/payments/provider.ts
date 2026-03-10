import { addMinutes } from "date-fns";
import { env } from "../../config/env.js";

export interface PaymentProvider {
  createPixCharge(input: {
    amount: number;
    description: string;
    payerName: string;
    payerEmail?: string;
    idempotencyKey?: string;
  }): Promise<{
    externalId: string;
    qrCode: string;
    pixCopyPaste: string;
    expiresAt?: Date;
    rawPayload: Record<string, unknown>;
  }>;
}

export class MercadoPagoProvider implements PaymentProvider {
  async createPixCharge(input: {
    amount: number;
    description: string;
    payerName: string;
    payerEmail?: string;
    idempotencyKey?: string;
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
          payerEmail: input.payerEmail
        }
      };
    }

    return {
      externalId: id,
      qrCode: `data:image/png;base64,REAL_READY_${id}`,
      pixCopyPaste: `PIX_REAL_READY_${input.amount}_${id}`,
      expiresAt: addMinutes(new Date(), 30),
      rawPayload: {
        mode: "adapter_ready",
        provider: "mercado_pago",
        accessTokenConfigured: true,
        idempotencyKey: input.idempotencyKey,
        payerName: input.payerName,
        payerEmail: input.payerEmail
      }
    };
  }
}
