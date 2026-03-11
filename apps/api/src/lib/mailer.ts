import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporterPromise: Promise<Transporter> | null = null;

export function isEmailConfigured() {
  return Boolean(env.SMTP_USER && env.SMTP_PASSWORD);
}

async function buildTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error("SMTP nao configurado");
  }

  if (env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
      }
    });
  }

  if (env.SMTP_USER.toLowerCase().endsWith("@gmail.com")) {
    return nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
      }
    });
  }

  throw new Error("SMTP_HOST obrigatorio para provedores nao Gmail");
}

async function getTransporter() {
  transporterPromise ??= buildTransporter();
  return transporterPromise;
}

export async function sendEmail(payload: EmailPayload) {
  if (!isEmailConfigured()) {
    throw new Error("SMTP nao configurado");
  }

  const transporter = await getTransporter();
  return transporter.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  });
}
