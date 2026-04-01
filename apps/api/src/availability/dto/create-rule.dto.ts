import { IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";

export class CreateRuleDto {
  @IsString()
  staffProfileId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "startTime must be HH:MM" })
  startTime!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "endTime must be HH:MM" })
  endTime!: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  slotIntervalMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
