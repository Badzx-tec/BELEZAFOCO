import { describe, it, expect } from "vitest";
import { enforcePlan } from "../src/lib/plan.js";

describe("plan enforcement", () => {
  it("bloqueia basic acima do limite", () => {
    expect(enforcePlan("basic", 5, 1, 100).allowed).toBe(false);
  });

  it("bloqueia trial acima do limite mensal", () => {
    expect(enforcePlan("trial", 2, 1, 61).allowed).toBe(false);
  });

  it("permite pro ilimitado", () => {
    expect(enforcePlan("pro", 99, 99, 9999).allowed).toBe(true);
  });
});
