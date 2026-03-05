export const appointmentStatuses = [
  "requested",
  "pending_payment",
  "confirmed",
  "cancelled",
  "rescheduled",
  "done",
  "no_show",
  "late_cancel"
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export type Plan = "trial" | "basic" | "pro";
