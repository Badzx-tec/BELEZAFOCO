import { describe, it, expect } from "vitest";
import { generateSlots, overlaps } from "../src/lib/scheduler.js";

describe("scheduler", () => {
  it("aplica buffers para bloquear conflito", () => {
    const slots = generateSlots({
      startAt: new Date("2026-01-01T09:00:00Z"),
      endAt: new Date("2026-01-01T10:00:00Z"),
      durationMinutes: 30,
      bufferBeforeMinutes: 10,
      bufferAfterMinutes: 10,
      existing: [{ startAt: new Date("2026-01-01T09:30:00Z"), endAt: new Date("2026-01-01T10:00:00Z") }]
    });
    expect(slots.map((d) => d.toISOString())).toEqual(["2026-01-01T09:00:00.000Z"]);
  });

  it("detecta overlap de profissional e recurso", () => {
    expect(overlaps(new Date("2026-01-01T10:00:00Z"), new Date("2026-01-01T11:00:00Z"), new Date("2026-01-01T10:30:00Z"), new Date("2026-01-01T11:30:00Z"))).toBe(true);
  });
});
