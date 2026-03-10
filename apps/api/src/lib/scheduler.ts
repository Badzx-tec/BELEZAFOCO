import { addMinutes, isBefore } from "date-fns";

export type TimeRange = {
  startAt: Date;
  endAt: Date;
};

export type SlotInput = {
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  prepMinutes?: number;
  finishMinutes?: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  slotIntervalMinutes?: number;
  existing: TimeRange[];
};

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function buildOccupiedWindow(input: {
  startAt: Date;
  durationMinutes: number;
  prepMinutes?: number;
  finishMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
}) {
  const prepMinutes = input.prepMinutes ?? 0;
  const finishMinutes = input.finishMinutes ?? 0;
  const bufferBeforeMinutes = input.bufferBeforeMinutes ?? 0;
  const bufferAfterMinutes = input.bufferAfterMinutes ?? 0;

  const occupiedStart = addMinutes(input.startAt, -(prepMinutes + bufferBeforeMinutes));
  const serviceEnd = addMinutes(input.startAt, input.durationMinutes);
  const occupiedEnd = addMinutes(serviceEnd, finishMinutes + bufferAfterMinutes);

  return {
    occupiedStart,
    serviceEnd,
    occupiedEnd
  };
}

export function floorToSlot(date: Date, slotIntervalMinutes = 15) {
  const floored = new Date(date);
  floored.setSeconds(0, 0);
  const minutes = floored.getMinutes();
  floored.setMinutes(minutes - (minutes % slotIntervalMinutes));
  return floored;
}

export function ceilToSlot(date: Date, slotIntervalMinutes = 15) {
  const floored = floorToSlot(date, slotIntervalMinutes);
  if (floored.getTime() === date.getTime()) return floored;
  return addMinutes(floored, slotIntervalMinutes);
}

export function buildSegments(input: {
  startAt: Date;
  durationMinutes: number;
  prepMinutes?: number;
  finishMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  slotIntervalMinutes?: number;
}) {
  const slotIntervalMinutes = input.slotIntervalMinutes ?? 15;
  const { occupiedStart, occupiedEnd } = buildOccupiedWindow(input);
  const segments: Date[] = [];
  let cursor = floorToSlot(occupiedStart, slotIntervalMinutes);
  const endCursor = ceilToSlot(occupiedEnd, slotIntervalMinutes);

  while (isBefore(cursor, endCursor)) {
    segments.push(cursor);
    cursor = addMinutes(cursor, slotIntervalMinutes);
  }

  return segments;
}

export function generateSlots(input: SlotInput) {
  const out: Date[] = [];
  const slotIntervalMinutes = input.slotIntervalMinutes ?? 15;
  let cursor = input.startAt;

  while (isBefore(addMinutes(cursor, input.durationMinutes), input.endAt) || addMinutes(cursor, input.durationMinutes).getTime() === input.endAt.getTime()) {
    const { occupiedStart, occupiedEnd } = buildOccupiedWindow({
      startAt: cursor,
      durationMinutes: input.durationMinutes,
      prepMinutes: input.prepMinutes,
      finishMinutes: input.finishMinutes,
      bufferBeforeMinutes: input.bufferBeforeMinutes,
      bufferAfterMinutes: input.bufferAfterMinutes
    });

    const conflicted = input.existing.some((existing) => overlaps(occupiedStart, occupiedEnd, existing.startAt, existing.endAt));
    if (!conflicted) out.push(cursor);
    cursor = addMinutes(cursor, slotIntervalMinutes);
  }

  return out;
}
