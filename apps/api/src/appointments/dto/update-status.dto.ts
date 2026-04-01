import { IsEnum, IsOptional, IsString } from "class-validator";

export enum AppointmentStatus {
  draft = "draft",
  pending_payment = "pending_payment",
  confirmed = "confirmed",
  checked_in = "checked_in",
  completed = "completed",
  cancelled = "cancelled",
  rescheduled = "rescheduled",
  no_show = "no_show"
}

const VALID_TRANSITIONS: Record<string, AppointmentStatus[]> = {
  draft: [AppointmentStatus.pending_payment, AppointmentStatus.confirmed, AppointmentStatus.cancelled],
  pending_payment: [AppointmentStatus.confirmed, AppointmentStatus.cancelled],
  confirmed: [AppointmentStatus.checked_in, AppointmentStatus.cancelled, AppointmentStatus.rescheduled, AppointmentStatus.no_show],
  checked_in: [AppointmentStatus.completed, AppointmentStatus.no_show],
  completed: [],
  cancelled: [],
  rescheduled: [],
  no_show: []
};

export function isValidTransition(from: string, to: AppointmentStatus): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

export class UpdateStatusDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @IsOptional()
  @IsString()
  cancelledReason?: string;
}
