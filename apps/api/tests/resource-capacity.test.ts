import { addMinutes } from "date-fns";
import { describe, expect, it } from "vitest";
import { buildFullyBookedResourceRanges, pickResourceUnit } from "../src/lib/resourceCapacity.js";

describe("resource capacity", () => {
  it("allocates the next free resource unit for the full occupied window", () => {
    const startAt = new Date("2026-01-01T10:00:00Z");
    const segmentStartsAt = [startAt, addMinutes(startAt, 15), addMinutes(startAt, 30)];

    const resourceUnit = pickResourceUnit(2, segmentStartsAt, [
      { startsAt: startAt, resourceUnit: 1 },
      { startsAt: addMinutes(startAt, 15), resourceUnit: 1 },
      { startsAt: addMinutes(startAt, 30), resourceUnit: 1 }
    ]);

    expect(resourceUnit).toBe(2);
  });

  it("only blocks a slot when every unit is already occupied", () => {
    const startAt = new Date("2026-01-01T10:00:00Z");
    const ranges = buildFullyBookedResourceRanges(
      [
        { startsAt: startAt, resourceUnit: 1 },
        { startsAt: startAt, resourceUnit: 2 },
        { startsAt: addMinutes(startAt, 15), resourceUnit: 1 }
      ],
      2,
      15
    );

    expect(ranges).toEqual([
      {
        startAt,
        endAt: addMinutes(startAt, 15)
      }
    ]);
  });
});
