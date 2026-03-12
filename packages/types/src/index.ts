export type UserRole = "owner" | "manager" | "coordinator" | "staff" | "receptionist" | "financial";

export type WorkspacePlan = "starter" | "growth" | "scale";

export type AppointmentStatus =
  | "draft"
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show";

export type LedgerDirection = "inflow" | "outflow";

export type LedgerEntryKind =
  | "receivable"
  | "payable"
  | "payment"
  | "commission"
  | "adjustment"
  | "cash_movement";

export interface WorkspaceRef {
  id: string;
  name: string;
  slug: string;
  timezone: string;
}
