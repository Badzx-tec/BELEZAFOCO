import { beforeAll, describe, expect, it } from "vitest";

let buildIdempotencyNamespace: typeof import("../src/lib/idempotency.js")["buildIdempotencyNamespace"];

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
  process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
  ({ buildIdempotencyNamespace } = await import("../src/lib/idempotency.js"));
});

describe("idempotency namespace", () => {
  it("namespaces keys by scope and workspace", () => {
    expect(
      buildIdempotencyNamespace({
        scope: "public_booking",
        workspaceId: "ws_1",
        key: "booking:slot:1"
      })
    ).toBe("public_booking:ws_1:booking:slot:1");
  });

  it("falls back to the global namespace when workspace is absent", () => {
    expect(
      buildIdempotencyNamespace({
        scope: "webhook",
        key: "evt_123"
      })
    ).toBe("webhook:global:evt_123");
  });
});
