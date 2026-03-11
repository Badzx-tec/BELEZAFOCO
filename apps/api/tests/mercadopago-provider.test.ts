import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadProvider() {
  vi.resetModules();
  return import("../src/modules/payments/provider.js");
}

describe("mercadopago provider", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_ACCESS_SECRET = "test_access_secret_123";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_123";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/belezafoco?schema=public";
    process.env.MP_ACCESS_TOKEN = "TEST-TOKEN";
    process.env.PUBLIC_URL = "https://belezafoco.app";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("cria cobranca pix com idempotency key e mapeia qr code", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          id: 123456789,
          status: "pending",
          date_of_expiration: "2026-03-10T12:30:00.000Z",
          point_of_interaction: {
            transaction_data: {
              qr_code: "00020126360014BR.GOV.BCB.PIX",
              qr_code_base64: "QUJDRA==",
              ticket_url: "https://www.mercadopago.com.br/ticket/123"
            }
          }
        })
    });
    vi.stubGlobal("fetch", fetchMock);

    const { MercadoPagoProvider } = await loadProvider();
    const provider = new MercadoPagoProvider();
    const payment = await provider.createPixCharge({
      amount: 2000,
      description: "Sinal manicure",
      payerName: "Ana Paula",
      payerEmail: "ana@example.com",
      idempotencyKey: "booking-123",
      externalReference: "appt-123"
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.mercadopago.com/v1/payments");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit)?.headers).toMatchObject({
      "X-Idempotency-Key": "booking-123"
    });
    expect(payment).toMatchObject({
      externalId: "123456789",
      pixCopyPaste: "00020126360014BR.GOV.BCB.PIX",
      qrCode: "data:image/png;base64,QUJDRA==",
      ticketUrl: "https://www.mercadopago.com.br/ticket/123"
    });
  });

  it("consulta pagamento e traduz status aprovado para pago", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          id: 987654321,
          status: "approved",
          status_detail: "accredited",
          point_of_interaction: {
            transaction_data: {
              qr_code: "pix-code",
              qr_code_base64: "QUJDRA=="
            }
          }
        })
    });
    vi.stubGlobal("fetch", fetchMock);

    const { MercadoPagoProvider } = await loadProvider();
    const provider = new MercadoPagoProvider();
    const payment = await provider.getPayment("987654321");

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.mercadopago.com/v1/payments/987654321");
    expect(payment.status).toBe("paid");
    expect(payment.statusDetail).toBe("accredited");
  });
});
