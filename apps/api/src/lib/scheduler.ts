import { addMinutes, isBefore } from "date-fns";

export type SlotInput = {
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  existing: Array<{ startAt: Date; endAt: Date }>;
};

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function generateSlots(input: SlotInput) {
  const out: Date[] = [];
  let cursor = input.startAt;
  while (isBefore(addMinutes(cursor, input.durationMinutes), input.endAt) || addMinutes(cursor, input.durationMinutes).getTime() === input.endAt.getTime()) {
    const slotStart = addMinutes(cursor, -input.bufferBeforeMinutes);
    const slotEnd = addMinutes(cursor, input.durationMinutes + input.bufferAfterMinutes);
    const conflicted = input.existing.some((existing) => overlaps(slotStart, slotEnd, existing.startAt, existing.endAt));
    if (!conflicted) out.push(cursor);
    cursor = addMinutes(cursor, 15);
  }
  return out;
}
