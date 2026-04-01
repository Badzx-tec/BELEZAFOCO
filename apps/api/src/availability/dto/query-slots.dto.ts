import { IsString, Matches } from "class-validator";

export class QuerySlotsDto {
  @IsString()
  staffProfileId!: string;

  @IsString()
  serviceId!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be YYYY-MM-DD" })
  date!: string;
}
