import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength
} from "class-validator";

export class RegisterDto {
  @IsString()
  businessName!: string;

  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class GoogleLoginDto {
  @IsString()
  credential!: string;

  @IsOptional()
  @IsString()
  csrfToken?: string;

  @IsOptional()
  @IsIn(["login", "register"])
  intent?: "login" | "register";

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class EmailOnlyDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  nextPassword!: string;
}

export class VerifyEmailDto {
  @IsString()
  token!: string;
}
