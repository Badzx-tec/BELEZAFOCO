import { addMinutes, isAfter, isBefore } from "date-fns";

export type TimeWindow = {
  startAt: Date;
  endAt: Date;
};

export type AppointmentIntervalInput = {
  startAt: Date;
  endAt?: Date;
  durationMinutes?: number;
  prepMinutes?: number;
  finishingMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
};

export type SlotInput = {
  windows: TimeWindow[];
  durationMinutes: number;
  prepMinutes?: number;
  finishingMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  stepMinutes?: number;
  existing: AppointmentIntervalInput[];
  blocked?: TimeWindow[];
  minStartAt?: Date;
};

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function getOccupiedInterval(input: AppointmentIntervalInput): TimeWindow {
  const appointmentEnd = input.endAt ?? addMinutes(input.startAt, input.durationMinutes ?? 0);
  const leadMinutes = (input.prepMinutes ?? 0) + (input.bufferBeforeMinutes ?? 0);
  const tailMinutes = (input.finishingMinutes ?? 0) + (input.bufferAfterMinutes ?? 0);

  return {
    startAt: addMinutes(input.startAt, -leadMinutes),
    endAt: addMinutes(appointmentEnd, tailMinutes)
  };
}

export function fitsWindow(window: TimeWindow, interval: TimeWindow) {
  return (
    (isAfter(interval.startAt, window.startAt) || interval.startAt.getTime() === window.startAt.getTime()) &&
    (isBefore(interval.endAt, window.endAt) || interval.endAt.getTime() === window.endAt.getTime())
  );
}

export function hasConflict(candidate: AppointmentIntervalInput, existing: AppointmentIntervalInput[], blocked: TimeWindow[] = []) {
  const occupiedCandidate = getOccupiedInterval(candidate);

  if (blocked.some((item) => overlaps(occupiedCandidate.startAt, occupiedCandidate.endAt, item.startAt, item.endAt))) {
    return true;
  }

  return existing.some((item) => {
    const occupiedExisting = getOccupiedInterval(item);
    return overlaps(occupiedCandidate.startAt, occupiedCandidate.endAt, occupiedExisting.startAt, occupiedExisting.endAt);
  });
}

export function intersectWindows(left: TimeWindow[], right: TimeWindow[]) {
  const result: TimeWindow[] = [];

  for (const a of left) {
    for (const b of right) {
      const startAt = a.startAt > b.startAt ? a.startAt : b.startAt;
      const endAt = a.endAt < b.endAt ? a.endAt : b.endAt;
      if (startAt < endAt) result.push({ startAt, endAt });
    }
  }

  return result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

export function generateSlots(input: SlotInput) {
  const out: Date[] = [];
  const stepMinutes = input.stepMinutes ?? 15;

  for (const window of input.windows) {
    let cursor = window.startAt;

    while (true) {
      const candidate = {
        startAt: cursor,
        durationMinutes: input.durationMinutes,
        prepMinutes: input.prepMinutes,
        finishingMinutes: input.finishingMinutes,
        bufferBeforeMinutes: input.bufferBeforeMinutes,
        bufferAfterMinutes: input.bufferAfterMinutes
      };
      const occupied = getOccupiedInterval(candidate);

      if (occupied.endAt.getTime() > window.endAt.getTime()) break;
      if (occupied.startAt.getTime() < window.startAt.getTime()) {
        cursor = addMinutes(cursor, stepMinutes);
        continue;
      }
      if (!input.minStartAt || cursor.getTime() >= input.minStartAt.getTime()) {
        if (!hasConflict(candidate, input.existing, input.blocked)) out.push(cursor);
      }

      cursor = addMinutes(cursor, stepMinutes);
    }
  }

  return out;
}
