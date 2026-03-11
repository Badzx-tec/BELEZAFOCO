import { describe, expect, it } from "vitest";
import { hasAnyRole } from "../src/lib/permissions.js";

describe("permissions", () => {
  it("permite hierarquia de owner para manager", () => {
    expect(hasAnyRole("owner", ["manager"])).toBe(true);
  });

  it("bloqueia staff em rota de receptionist", () => {
    expect(hasAnyRole("staff", ["receptionist"])).toBe(false);
  });
});
