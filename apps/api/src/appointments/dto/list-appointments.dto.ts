import { IsEnum, IsOptional, IsString, Matches } from "class-validator";
import { AppointmentStatus } from "./update-status.dto";

export class ListAppointmentsDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be YYYY-MM-DD" })
  date?: string;

  @IsOptional()
  @IsString()
  staffProfileId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
