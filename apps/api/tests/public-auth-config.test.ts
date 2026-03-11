import { describe, expect, it } from "vitest";
import { buildPublicAuthConfig } from "../src/modules/auth/publicAuthConfig.js";

describe("public auth config", () => {
  it("desabilita Google quando nao existe client id configurado", () => {
    const config = buildPublicAuthConfig(
      {
        publicUrl: "https://app.belezafoco.com"
      },
      "https://app.belezafoco.com"
    );

    expect(config.googleConfigured).toBe(false);
    expect(config.googleEnabled).toBe(false);
    expect(config.googleClientId).toBeNull();
    expect(config.googleDisabledReason).toContain("GOOGLE_CLIENT_ID");
  });

  it("mantem Google ativo quando a origem publicada bate com o ambiente", () => {
    const config = buildPublicAuthConfig(
      {
        googleClientId: "google-client-id",
        publicUrl: "https://app.belezafoco.com"
      },
      "https://app.belezafoco.com/auth"
    );

    expect(config.googleConfigured).toBe(true);
    expect(config.googleEnabled).toBe(true);
    expect(config.googleClientId).toBe("google-client-id");
    expect(config.googleDisabledReason).toBeNull();
  });

  it("bloqueia Google em origem nao autorizada para evitar botao quebrado em producao", () => {
    const config = buildPublicAuthConfig(
      {
        googleClientId: "google-client-id",
        publicUrl: "https://app.belezafoco.com"
      },
      "https://preview.code.run/auth"
    );

    expect(config.googleConfigured).toBe(true);
    expect(config.googleEnabled).toBe(false);
    expect(config.googleClientId).toBeNull();
    expect(config.googleDisabledReason).toContain("preview.code.run");
  });

  it("aceita overrides explicitos via GOOGLE_ALLOWED_ORIGINS", () => {
    const config = buildPublicAuthConfig(
      {
        googleClientId: "google-client-id",
        publicUrl: "https://app.belezafoco.com",
        googleAllowedOrigins: "https://app.belezafoco.com, https://preview.code.run"
      },
      "https://preview.code.run/auth"
    );

    expect(config.googleEnabled).toBe(true);
    expect(config.googleClientId).toBe("google-client-id");
  });
});
