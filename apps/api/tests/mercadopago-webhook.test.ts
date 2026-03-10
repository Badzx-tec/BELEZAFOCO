import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  parseMercadoPagoSignatureHeader,
  verifyMercadoPagoWebhookSignature,
  verifySharedWebhookSecret
} from "../src/modules/payments/webhook-security.js";

describe("mercadopago webhook security", () => {
  it("aceita assinatura valida com manifest oficial", () => {
    const secret = "segredo-super-forte";
    const timestamp = "1710028800";
    const requestId = "req-123";
    const dataId = "mp_abc123";
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    const signature = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(
      verifyMercadoPagoWebhookSignature({
        secret,
        signatureHeader: `ts=${timestamp},v1=${signature}`,
        requestIdHeader: requestId,
        dataId,
        now: new Date("2024-03-10T00:00:00.000Z")
      })
    ).toBe(true);
  });

  it("rejeita webhook com timestamp antigo", () => {
    const secret = "segredo-super-forte";
    const timestamp = "1710028800";
    const requestId = "req-123";
    const dataId = "mp_abc123";
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    const signature = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(
      verifyMercadoPagoWebhookSignature({
        secret,
        signatureHeader: `ts=${timestamp},v1=${signature}`,
        requestIdHeader: requestId,
        dataId,
        now: new Date("2024-03-10T00:10:01.000Z")
      })
    ).toBe(false);
  });

  it("faz fallback para segredo compartilhado em comparacao constante", () => {
    expect(
      verifySharedWebhookSecret({
        expectedSecret: "abc123",
        providedSecret: "abc123"
      })
    ).toBe(true);

    expect(
      verifySharedWebhookSecret({
        expectedSecret: "abc123",
        providedSecret: "abc124"
      })
    ).toBe(false);
  });

  it("parseia o header do Mercado Pago", () => {
    expect(parseMercadoPagoSignatureHeader("ts=1710028800,v1=ABCDEF")).toEqual({
      timestamp: "1710028800",
      signature: "abcdef"
    });
  });
});
