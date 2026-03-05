import { describe, it, expect } from "vitest";

function shouldSend(existing: Set<string>, appointmentId: string, type: string) {
  const key = `${appointmentId}:${type}`;
  if (existing.has(key)) return false;
  existing.add(key);
  return true;
}

describe("reminder dedupe", () => {
  it("envia apenas uma vez por tipo", () => {
    const log = new Set<string>();
    expect(shouldSend(log, "a1", "reminder_24h")).toBe(true);
    expect(shouldSend(log, "a1", "reminder_24h")).toBe(false);
  });
});
