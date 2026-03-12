import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

interface MailDeliveryResult {
  messageId?: string;
  mode: "preview" | "smtp";
  previewUrl?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("SMTP_HOST");
    const user = this.configService.get<string>("SMTP_USER");

    if (!host || !user) {
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.configService.get("SMTP_PORT", "587")),
      secure: Number(this.configService.get("SMTP_PORT", "587")) === 465,
      auth: {
        user,
        pass: this.configService.get<string>("SMTP_PASSWORD", "")
      }
    });
  }

  async sendEmailVerification(input: {
    email: string;
    fullName: string;
    verificationUrl: string;
  }) {
    return this.sendMail({
      email: input.email,
      fullName: input.fullName,
      previewUrl: input.verificationUrl,
      subject: "Confirme seu e-mail no BELEZAFOCO 2.0",
      html: `
        <div style="font-family:Arial,sans-serif;background:#fffaf5;color:#0f172a;padding:24px">
          <h1 style="font-size:24px;margin:0 0 16px">Confirme seu e-mail</h1>
          <p style="line-height:1.6;margin:0 0 16px">Oi ${input.fullName}, finalize a ativacao do seu workspace clicando no botao abaixo.</p>
          <p style="margin:24px 0">
            <a href="${input.verificationUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 20px;border-radius:999px;text-decoration:none;font-weight:700">
              Verificar e-mail
            </a>
          </p>
          <p style="line-height:1.6;margin:0;color:#64748b">Se o botao nao abrir, copie este link: ${input.verificationUrl}</p>
        </div>
      `,
      text: `Oi ${input.fullName}, confirme seu e-mail no BELEZAFOCO 2.0: ${input.verificationUrl}`
    });
  }

  async sendPasswordReset(input: {
    email: string;
    fullName: string;
    resetUrl: string;
  }) {
    return this.sendMail({
      email: input.email,
      fullName: input.fullName,
      previewUrl: input.resetUrl,
      subject: "Redefina sua senha no BELEZAFOCO 2.0",
      html: `
        <div style="font-family:Arial,sans-serif;background:#fffaf5;color:#0f172a;padding:24px">
          <h1 style="font-size:24px;margin:0 0 16px">Redefina sua senha</h1>
          <p style="line-height:1.6;margin:0 0 16px">Oi ${input.fullName}, use o link abaixo para criar uma nova senha segura.</p>
          <p style="margin:24px 0">
            <a href="${input.resetUrl}" style="display:inline-block;background:#c26b36;color:#ffffff;padding:14px 20px;border-radius:999px;text-decoration:none;font-weight:700">
              Criar nova senha
            </a>
          </p>
          <p style="line-height:1.6;margin:0;color:#64748b">Se voce nao pediu essa redefinicao, ignore este e-mail.</p>
        </div>
      `,
      text: `Oi ${input.fullName}, redefina sua senha no BELEZAFOCO 2.0: ${input.resetUrl}`
    });
  }

  private async sendMail(input: {
    email: string;
    fullName: string;
    html: string;
    previewUrl: string;
    subject: string;
    text: string;
  }): Promise<MailDeliveryResult> {
    if (!this.transporter) {
      this.logger.log(
        `[mail-preview] ${input.subject} -> ${input.email} | ${input.previewUrl}`
      );
      return {
        mode: "preview",
        previewUrl: input.previewUrl
      };
    }

    const info = await this.transporter.sendMail({
      from: this.configService.get("SMTP_FROM", "BELEZAFOCO 2.0 <no-reply@belezafoco.dev>"),
      to: `${input.fullName} <${input.email}>`,
      subject: input.subject,
      html: input.html,
      text: input.text
    });

    return {
      mode: "smtp",
      messageId: info.messageId,
      previewUrl: input.previewUrl
    };
  }
}
