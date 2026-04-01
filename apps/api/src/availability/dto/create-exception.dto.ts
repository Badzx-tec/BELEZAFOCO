import { IsBoolean, IsDateString, IsOptional, IsString } from "class-validator";

export class CreateExceptionDto {
  @IsOptional()
  @IsString()
  staffProfileId?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
