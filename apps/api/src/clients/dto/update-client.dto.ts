import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength
} from "class-validator";

export enum ClientStatus {
  active = "active",
  inactive = "inactive",
  archived = "archived"
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  communicationConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  emailConsent?: boolean;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}
