import { env } from "../../config/env.js";
import { isEmailConfigured, sendEmail } from "../../lib/mailer.js";

const WHATSAPP_GRAPH_API_BASE_URL = "https://graph.facebook.com";

type WhatsAppCloudApiSendResponse = {
  messaging_product?: string;
  contacts?: Array<{ wa_id?: string | null }>;
  messages?: Array<{ id?: string | null }>;
  error?: {
    message?: string;
    error_data?: { details?: string };
    code?: number;
  };
};

export type MessagePayload = {
  to: string;
  templateName: string;
  language: string;
  variables: Record<string, string>;
};

export type MessagingProviderResponse = {
  status: "sent" | "failed";
  provider: string;
  response?: string;
};

export interface MessagingProvider {
  sendTemplate(payload: MessagePayload): Promise<MessagingProviderResponse>;
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

function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

function buildTemplateComponents(variables: Record<string, string>) {
  const parameters = Object.entries(variables)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([, value]) => ({
      type: "text" as const,
      text: String(value)
    }));

  if (!parameters.length) {
    return undefined;
  }

  return [
    {
      type: "body" as const,
      parameters
    }
  ];
}

async function whatsappCloudApiRequest<T>(path: string, init: RequestInit) {
  if (!env.WHATSAPP_CLOUD_API_TOKEN || !env.WHATSAPP_CLOUD_PHONE_ID) {
    throw new Error("WhatsApp Cloud API nao configurado");
  }

  const response = await fetch(`${WHATSAPP_GRAPH_API_BASE_URL}/${env.WHATSAPP_CLOUD_API_VERSION}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_CLOUD_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    signal: AbortSignal.timeout(10_000)
  });

  const raw = await response.text();
  const payload = raw ? (JSON.parse(raw) as WhatsAppCloudApiSendResponse) : null;

  if (!response.ok) {
    const details =
      payload?.error?.message ??
      payload?.error?.error_data?.details ??
      raw ??
      "erro desconhecido";
    throw new Error(`WhatsApp Cloud API ${response.status}: ${details}`);
  }

  return payload as T;
}

export class WhatsAppCloudApiProvider implements MessagingProvider {
  async sendTemplate(payload: MessagePayload) {
    try {
      const normalizedPhone = normalizePhoneNumber(payload.to);
      if (!normalizedPhone) {
        throw new Error("Numero de WhatsApp invalido");
      }

      const components = buildTemplateComponents(payload.variables);
      const response = await whatsappCloudApiRequest<WhatsAppCloudApiSendResponse>(
        `/${env.WHATSAPP_CLOUD_PHONE_ID}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: normalizedPhone,
            type: "template",
            template: {
              name: payload.templateName,
              language: { code: payload.language || "pt_BR" },
              ...(components ? { components } : {})
            }
          })
        }
      );

      return {
        status: "sent" as const,
        provider: "whatsapp_cloud_api",
        response: JSON.stringify({
          contactWaId: response.contacts?.[0]?.wa_id ?? normalizedPhone,
          messageId: response.messages?.[0]?.id ?? null
        })
      };
    } catch (error) {
      return {
        status: "failed" as const,
        provider: "whatsapp_cloud_api",
        response: error instanceof Error ? error.message : "Falha ao enviar template pelo WhatsApp"
      };
    }
  }
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
    return new WhatsAppCloudApiProvider();
  }

  return new DisabledWhatsAppProvider("WhatsApp desabilitado neste ambiente");
}
