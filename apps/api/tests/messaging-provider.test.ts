import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadProvider() {
  vi.resetModules();
  return import("../src/modules/messaging/provider.js");
}

describe("whatsapp cloud api provider", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_ACCESS_SECRET = "test_access_secret_123";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_123";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/belezafoco?schema=public";
    process.env.WHATSAPP_PROVIDER = "cloud_api";
    process.env.WHATSAPP_CLOUD_API_TOKEN = "wa-token";
    process.env.WHATSAPP_CLOUD_PHONE_ID = "123456789";
    process.env.WHATSAPP_CLOUD_API_VERSION = "v23.0";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia template para a Cloud API com telefone normalizado e componentes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          contacts: [{ wa_id: "5511999990000" }],
          messages: [{ id: "wamid.HBgNODk5OTk5OTk5OTk5FQIAERgSMEZDOTU4QjA1MDQ1N0QxAA==" }]
        })
    });
    vi.stubGlobal("fetch", fetchMock);

    const { WhatsAppCloudApiProvider } = await loadProvider();
    const provider = new WhatsAppCloudApiProvider();
    const response = await provider.sendTemplate({
      to: "+55 (11) 99999-0000",
      templateName: "belezafoco_reminder_24h",
      language: "pt_BR",
      variables: {
        clientName: "Ana Paula",
        serviceName: "Corte Premium",
        date: "11/03/2026",
        time: "10:00"
      }
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://graph.facebook.com/v23.0/123456789/messages");
    expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit)?.body))).toEqual({
      messaging_product: "whatsapp",
      to: "5511999990000",
      type: "template",
      template: {
        name: "belezafoco_reminder_24h",
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: "Ana Paula" },
              { type: "text", text: "Corte Premium" },
              { type: "text", text: "11/03/2026" },
              { type: "text", text: "10:00" }
            ]
          }
        ]
      }
    });
    expect(response.status).toBe("sent");
    expect(response.provider).toBe("whatsapp_cloud_api");
  });
});
