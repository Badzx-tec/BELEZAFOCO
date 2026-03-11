import { describe, expect, it } from "vitest";
import { buildPublicBookingUrl, normalizeWorkspaceSlug } from "./auth-ui";

describe("auth ui helpers", () => {
  it("normalizes business names into clean public slugs", () => {
    expect(normalizeWorkspaceSlug("Studio Beleza Foco")).toBe("studio-beleza-foco");
    expect(normalizeWorkspaceSlug("Cílios & Sobrancelha")).toBe("cilios-sobrancelha");
  });

  it("builds the public booking url with the current origin", () => {
    expect(buildPublicBookingUrl("https://painel.belezafoco.app/", "Studio Beleza Foco")).toBe(
      "https://painel.belezafoco.app/b/studio-beleza-foco"
    );
  });

  it("falls back to a placeholder slug when the business name is empty", () => {
    expect(buildPublicBookingUrl("", "")).toBe("/b/seu-negocio");
  });
});
