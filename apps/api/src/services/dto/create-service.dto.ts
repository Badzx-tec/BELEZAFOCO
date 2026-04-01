import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength
} from "class-validator";

export enum ServicePricingModel {
  fixed = "fixed",
  starts_at = "starts_at"
}

export class CreateServiceDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ServicePricingModel)
  pricingModel?: ServicePricingModel;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsBoolean()
  depositRequired?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  depositAmountCents?: number;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferBeforeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferAfterMinutes?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
