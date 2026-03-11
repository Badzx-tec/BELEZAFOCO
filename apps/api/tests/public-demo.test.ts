import { describe, expect, it } from "vitest";
import {
  createDemoPublicBookingResponse,
  createDemoPublicSlotsResponse,
  DEMO_PUBLIC_SLUG,
  shouldUsePublicDemoFallback
} from "../src/modules/public/demo.js";

describe("public demo fallback", () => {
  it("exposes deterministic demo slots for the reserved slug", () => {
    const response = createDemoPublicSlotsResponse("2026-03-11", "service-cut");

    expect(response.staffMemberId).toBe("staff-joao");
    expect(response.slots).toHaveLength(4);
    expect(response.slots[0]).toBe("2026-03-11T12:15:00.000Z");
  });

  it("creates confirmed bookings for demo services without deposit", () => {
    const response = createDemoPublicBookingResponse({
      serviceId: "service-cut",
      startAt: "2026-03-11T12:15:00.000Z"
    });

    expect(response).toMatchObject({
      appointmentId: "demo-service-cut-202603111215",
      status: "confirmed"
    });
  });

  it("creates pending payment payloads for demo deposit services", () => {
    const response = createDemoPublicBookingResponse({
      serviceId: "service-nail",
      startAt: "2026-03-11T15:00:00.000Z"
    });

    expect(response).toMatchObject({
      appointmentId: "demo-service-nail-202603111500",
      status: "pending_payment"
    });
    expect(response?.payment?.pixCopyPaste).toContain("BR.GOV.BCB.PIX");
  });

  it("only enables fallback for the reserved demo slug", () => {
    expect(
      shouldUsePublicDemoFallback({
        slug: DEMO_PUBLIC_SLUG,
        enabled: true,
        error: new Error("Can't reach database server at localhost:5432")
      })
    ).toBe(true);
    expect(
      shouldUsePublicDemoFallback({
        slug: "cliente-real",
        enabled: true,
        error: new Error("Can't reach database server at localhost:5432")
      })
    ).toBe(false);
  });
});
