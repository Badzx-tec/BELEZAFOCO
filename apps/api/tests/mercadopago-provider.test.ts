import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildMercadoPagoWebhookManifest,
  mapMercadoPagoStatus,
  verifyMercadoPagoWebhookSignature
} from "../src/modules/payments/provider.js";

describe("mercado pago helpers", () => {
  it("maps provider status into local payment status", () => {
    expect(mapMercadoPagoStatus("approved")).toBe("paid");
    expect(mapMercadoPagoStatus("rejected")).toBe("failed");
    expect(mapMercadoPagoStatus("cancelled")).toBe("cancelled");
    expect(mapMercadoPagoStatus("expired")).toBe("expired");
    expect(mapMercadoPagoStatus("pending")).toBe("pending");
  });

  it("validates webhook signatures with the expected manifest template", () => {
    const manifest = buildMercadoPagoWebhookManifest({
      dataId: "987654321",
      requestIdHeader: "req-123",
      ts: "1710000000"
    });
    const secret = "top_secret";
    const digest = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(
      verifyMercadoPagoWebhookSignature({
        dataId: "987654321",
        requestIdHeader: "req-123",
        signatureHeader: `ts=1710000000,v1=${digest}`,
        secret
      })
    ).toBe(true);
  });
});
