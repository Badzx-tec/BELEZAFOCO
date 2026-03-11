import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWhatsAppWebhookSignature } from "../src/modules/messaging/webhook-security.js";

describe("whatsapp webhook security", () => {
  it("aceita assinatura valida do Meta webhook", () => {
    const rawBody = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{ id: "123", changes: [{ field: "messages" }] }]
    });
    const signature = createHmac("sha256", "meta-secret").update(rawBody).digest("hex");

    expect(
      verifyWhatsAppWebhookSignature({
        appSecret: "meta-secret",
        rawBody,
        signatureHeader: `sha256=${signature}`
      })
    ).toBe(true);
  });

  it("rejeita assinatura invalida", () => {
    expect(
      verifyWhatsAppWebhookSignature({
        appSecret: "meta-secret",
        rawBody: "{\"object\":\"whatsapp_business_account\"}",
        signatureHeader: "sha256=invalid"
      })
    ).toBe(false);
  });
});
