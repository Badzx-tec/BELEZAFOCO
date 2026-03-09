import { addMinutes } from "date-fns";

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
    expiresAt?: Date | null;
    idempotencyKey?: string | null;
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
    return {
      externalId: id,
      qrCode: `data:image/png;base64,MOCK_${id}`,
      pixCopyPaste: `00020126${input.amount}${input.description}`,
      expiresAt: addMinutes(new Date(), 30),
      idempotencyKey: input.idempotencyKey ?? id
    };
  }
}
