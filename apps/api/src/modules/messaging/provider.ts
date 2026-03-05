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

export class SmsPlaceholderProvider implements MessagingProvider {
  async sendTemplate() {
    return { status: "failed" as const, provider: "sms", response: "SMS não implementado no MVP" };
  }
}

export class EmailFallbackProvider implements MessagingProvider {
  async sendTemplate(payload: MessagePayload) {
    return { status: "sent" as const, provider: "email", response: `fallback:${payload.templateName}` };
  }
}
