import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  EmailOnlyDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto
} from "./dto/auth.dto";
import {
  applyAuthCookies,
  clearAuthCookies,
  extractRequestMetadata
} from "./auth.utils";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body() body: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.register(body, extractRequestMetadata(request));
    applyAuthCookies(response, result.cookies);
    return {
      ...result.response,
      ...(result.verificationTokenPreview
        ? { verificationTokenPreview: result.verificationTokenPreview }
        : {})
    };
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.login(body, extractRequestMetadata(request));
    applyAuthCookies(response, result.cookies);
    return result.response;
  }

  @Post("google")
  @HttpCode(200)
  async google(
    @Body() body: GoogleLoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.google(body, request, extractRequestMetadata(request));
    applyAuthCookies(response, result.cookies);
    return result.response;
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.refresh(request, extractRequestMetadata(request));
    applyAuthCookies(response, result.cookies);
    return result.response;
  }

  @Post("logout")
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.logout(request);
    clearAuthCookies(response, result.secureCookies);
    return {
      status: "logged_out"
    };
  }

  @Post("request-password-reset")
  @HttpCode(200)
  async requestPasswordReset(@Body() body: EmailOnlyDto) {
    return this.authService.requestPasswordReset(body);
  }

  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.resetPassword(body, extractRequestMetadata(request));
    applyAuthCookies(response, result.cookies);
    return result.response;
  }

  @Post("resend-verification")
  @HttpCode(200)
  async resendVerification(@Body() body: EmailOnlyDto) {
    return this.authService.resendVerification(body);
  }

  @Post("verify-email")
  @HttpCode(200)
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body);
  }
}
