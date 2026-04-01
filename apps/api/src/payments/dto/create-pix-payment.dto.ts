import { IsOptional, IsString } from "class-validator";

export class CreatePixPaymentDto {
  @IsString()
  appointmentId!: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
