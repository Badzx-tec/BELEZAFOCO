import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MailModule } from "../mail/mail.module";
import { AuthController } from "./auth.controller";
import { CsrfGuard } from "./csrf.guard";
import { AuthService } from "./auth.service";
import { RolesGuard } from "./roles.guard";
import { SessionAuthGuard } from "./session-auth.guard";

@Module({
  imports: [JwtModule.register({}), MailModule],
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard, CsrfGuard, RolesGuard],
  exports: [AuthService, SessionAuthGuard, CsrfGuard, RolesGuard]
})
export class AuthModule {}
