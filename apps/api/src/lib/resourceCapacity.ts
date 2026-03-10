import { addMinutes } from "date-fns";
import type { TimeRange } from "./scheduler.js";

type ResourceSlotSegment = {
  startsAt: Date;
  resourceUnit: number | null;
};

export function pickResourceUnit(capacity: number, segmentStartsAt: Date[], existingSegments: ResourceSlotSegment[]) {
  if (capacity < 1) {
    return null;
  }

  const occupiedByStart = new Map<number, Set<number>>();

  for (const segment of existingSegments) {
    if (!segment.resourceUnit) continue;
    const key = segment.startsAt.getTime();
    const units = occupiedByStart.get(key) ?? new Set<number>();
    units.add(segment.resourceUnit);
    occupiedByStart.set(key, units);
  }

  for (let resourceUnit = 1; resourceUnit <= capacity; resourceUnit += 1) {
    const isFreeForWholeWindow = segmentStartsAt.every((segmentStart) => {
      const occupiedUnits = occupiedByStart.get(segmentStart.getTime());
      return !occupiedUnits?.has(resourceUnit);
    });

    if (isFreeForWholeWindow) {
      return resourceUnit;
    }
  }

  return null;
}

export function buildFullyBookedResourceRanges(
  existingSegments: ResourceSlotSegment[],
  capacity: number,
  slotIntervalMinutes: number
): TimeRange[] {
  if (capacity < 1) {
    return [];
  }

  const occupiedByStart = new Map<number, Set<number>>();

  for (const segment of existingSegments) {
    if (!segment.resourceUnit) continue;
    const key = segment.startsAt.getTime();
    const units = occupiedByStart.get(key) ?? new Set<number>();
    units.add(segment.resourceUnit);
    occupiedByStart.set(key, units);
  }

  return [...occupiedByStart.entries()]
    .filter(([, units]) => units.size >= capacity)
    .sort((a, b) => a[0] - b[0])
    .map(([slotTimestamp]) => {
      const startAt = new Date(slotTimestamp);
      return {
        startAt,
        endAt: addMinutes(startAt, slotIntervalMinutes)
      };
    });
}
