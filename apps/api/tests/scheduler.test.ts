import { describe, it, expect } from "vitest";
import { generateSlots, getOccupiedInterval, hasConflict, overlaps } from "../src/lib/scheduler.js";

describe("scheduler", () => {
  it("considera buffers e preparo sem eliminar slots válidos", () => {
    const slots = generateSlots({
      windows: [
        {
          startAt: new Date("2026-01-01T09:00:00.000Z"),
          endAt: new Date("2026-01-01T11:00:00.000Z")
        }
      ],
      durationMinutes: 30,
      prepMinutes: 5,
      finishingMinutes: 5,
      bufferBeforeMinutes: 10,
      bufferAfterMinutes: 10,
      existing: [
        {
          startAt: new Date("2026-01-01T10:15:00.000Z"),
          endAt: new Date("2026-01-01T10:45:00.000Z")
        }
      ]
    });

    expect(slots.map((item) => item.toISOString())).toEqual([
      "2026-01-01T09:15:00.000Z",
      "2026-01-01T09:30:00.000Z"
    ]);
  });

  it("bloqueia conflitos por intervalo manual", () => {
    const conflict = hasConflict(
      {
        startAt: new Date("2026-01-01T13:00:00.000Z"),
        durationMinutes: 45
      },
      [],
      [
        {
          startAt: new Date("2026-01-01T13:15:00.000Z"),
          endAt: new Date("2026-01-01T14:00:00.000Z")
        }
      ]
    );

    expect(conflict).toBe(true);
  });

  it("expande o intervalo ocupado com buffers e finalização", () => {
    const occupied = getOccupiedInterval({
      startAt: new Date("2026-01-01T10:00:00.000Z"),
      durationMinutes: 40,
      prepMinutes: 5,
      finishingMinutes: 10,
      bufferBeforeMinutes: 5,
      bufferAfterMinutes: 5
    });

    expect(occupied.startAt.toISOString()).toBe("2026-01-01T09:50:00.000Z");
    expect(occupied.endAt.toISOString()).toBe("2026-01-01T10:55:00.000Z");
  });

  it("detecta overlap de profissional e recurso", () => {
    expect(
      overlaps(
        new Date("2026-01-01T10:00:00.000Z"),
        new Date("2026-01-01T11:00:00.000Z"),
        new Date("2026-01-01T10:30:00.000Z"),
        new Date("2026-01-01T11:30:00.000Z")
      )
    ).toBe(true);
  });
});
