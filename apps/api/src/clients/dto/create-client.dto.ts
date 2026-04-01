import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength
} from "class-validator";

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

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
}
