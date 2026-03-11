import { env } from "../../config/env.js";
import { isEmailConfigured, sendEmail } from "../../lib/mailer.js";

export type MessagePayload = {
  to: string;
  templateName: string;
  language: string;
  variables: Record<string, string>;
};

export interface MessagingProvider {
  sendTemplate(payload: MessagePayload): Promise<{ status: "sent" | "failed"; provider: string; response?: string }>;
}

export class MockWhatsAppProvider implements MessagingProvider {
  async sendTemplate(payload: MessagePayload) {
    return { status: "sent" as const, provider: "mock_whatsapp", response: JSON.stringify(payload) };
  }
}

export class DisabledWhatsAppProvider implements MessagingProvider {
  constructor(private readonly reason: string) {}

  async sendTemplate() {
    return { status: "failed" as const, provider: "whatsapp_disabled", response: this.reason };
  }
}

function buildEmailCopy(payload: MessagePayload) {
  const businessName = payload.variables.businessName ?? "BELEZAFOCO";
  const serviceName = payload.variables.serviceName ?? "seu atendimento";
  const date = payload.variables.date ?? "";
  const time = payload.variables.time ?? "";
  const staffName = payload.variables.staffName ?? "nossa equipe";
  const address = payload.variables.address ? `<p><strong>Endereco:</strong> ${payload.variables.address}</p>` : "";
  const actionLink =
    payload.variables.rescheduleLink || payload.variables.cancelLink
      ? `<p><a href="${payload.variables.rescheduleLink ?? payload.variables.cancelLink}">Gerenciar atendimento</a></p>`
      : "";

  if (payload.templateName === "reminder_24h" || payload.templateName === "reminder_2h") {
    return {
      subject: `${businessName}: lembrete do seu atendimento`,
      text: `Lembrete do seu atendimento de ${serviceName} em ${date} as ${time} com ${staffName}.`,
      html: `<p>Seu atendimento de <strong>${serviceName}</strong> esta agendado para <strong>${date} as ${time}</strong> com <strong>${staffName}</strong>.</p>${address}${actionLink}`
    };
  }

  return {
    subject: `${businessName}: atualizacao do seu atendimento`,
    text: `Existe uma atualizacao para o seu atendimento de ${serviceName}.`,
    html: `<p>Existe uma atualizacao para o seu atendimento de <strong>${serviceName}</strong>.</p>${address}${actionLink}`
  };
}

export class EmailNotificationProvider implements MessagingProvider {
  async sendTemplate(payload: MessagePayload) {
    if (!payload.to || !isEmailConfigured()) {
      return { status: "failed" as const, provider: "email", response: "SMTP nao configurado ou destinatario ausente" };
    }

    const message = buildEmailCopy(payload);
    const result = await sendEmail({
      to: payload.to,
      subject: message.subject,
      text: message.text,
      html: message.html
    });

    return { status: "sent" as const, provider: "email", response: result.messageId };
  }
}

export function buildMessagingProvider(): MessagingProvider {
  if (env.WHATSAPP_PROVIDER === "mock" && env.NODE_ENV !== "production") {
    return new MockWhatsAppProvider();
  }

  if (env.WHATSAPP_PROVIDER === "cloud_api") {
    return new DisabledWhatsAppProvider("WhatsApp Cloud API ainda nao foi configurado neste ambiente");
  }

  return new DisabledWhatsAppProvider("WhatsApp desabilitado neste ambiente");
}
