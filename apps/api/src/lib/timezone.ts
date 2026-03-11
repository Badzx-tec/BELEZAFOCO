import { fromZonedTime, toZonedTime } from "date-fns-tz";

export function zonedDateTime(date: string, time: string, timeZone: string) {
  return fromZonedTime(`${date}T${time}:00`, timeZone);
}

export function startOfZonedDay(date: string, timeZone: string) {
  return fromZonedTime(`${date}T00:00:00`, timeZone);
}

export function endOfZonedDay(date: string, timeZone: string) {
  return fromZonedTime(`${date}T23:59:59.999`, timeZone);
}

export function zonedWeekday(date: Date, timeZone: string) {
  return toZonedTime(date, timeZone).getDay();
}

export function zonedDateKey(date: Date, timeZone: string) {
  const zoned = toZonedTime(date, timeZone);
  const year = zoned.getFullYear();
  const month = `${zoned.getMonth() + 1}`.padStart(2, "0");
  const day = `${zoned.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
