import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateAppointmentDto {
  @IsString()
  serviceId!: string;

  @IsString()
  staffProfileId!: string;

  @IsString()
  clientId!: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
