export interface PaymentProvider {
  createPixCharge(input: { amount: number; description: string; payerName: string; payerEmail?: string }): Promise<{ externalId: string; qrCode: string; pixCopyPaste: string }>;
}

export class MercadoPagoProvider implements PaymentProvider {
  async createPixCharge(input: { amount: number; description: string; payerName: string; payerEmail?: string }) {
    const id = `mp_${Date.now()}`;
    return {
      externalId: id,
      qrCode: `data:image/png;base64,MOCK_${id}`,
      pixCopyPaste: `00020126${input.amount}${input.description}`
    };
  }
}
