import { describe, it, expect } from "vitest";
import { buildSubscriptionSeed, enforcePlan } from "../src/lib/plan.js";

describe("plan enforcement", () => {
  it("bloqueia basic acima do limite", () => {
    expect(
      enforcePlan(
        { ...buildSubscriptionSeed("trial"), appointmentsThisMonth: 100 },
        4,
        1,
        100
      ).allowed
    ).toBe(false);
  });

  it("permite pro ilimitado", () => {
    expect(
      enforcePlan(
        { ...buildSubscriptionSeed("pro"), appointmentsThisMonth: 9999 },
        99,
        99,
        9999
      ).allowed
    ).toBe(true);
  });
});
