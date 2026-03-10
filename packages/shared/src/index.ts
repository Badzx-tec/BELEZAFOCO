export const roles = ["owner", "manager", "receptionist", "staff"] as const;
export type Role = (typeof roles)[number];

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

export const plans = ["trial", "basic", "pro"] as const;
export type Plan = (typeof plans)[number];

export const subscriptionStatuses = [
  "trialing",
  "active",
  "past_due",
  "paused",
  "cancelled"
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const checklistKeys = [
  "workspace_profile",
  "business_hours",
  "service_catalog",
  "team_setup",
  "public_booking"
] as const;
export type ChecklistKey = (typeof checklistKeys)[number];
