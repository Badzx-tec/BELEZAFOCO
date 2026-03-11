import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  process.env.BELEZAFOCO_ENV_PATH,
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(currentDir, "../../../.env")
].filter((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0);

for (const candidate of envCandidates) {
  if (!existsSync(candidate)) continue;
  loadDotenv({ path: candidate, override: false });
  break;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/belezafoco?schema=public"),
  DIRECT_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGIN: z.string().default("*"),
  LOG_LEVEL: z.string().optional(),
  API_BASE_URL: z.string().optional(),
  SUPERADMIN_EMAIL: z.string().email().optional(),
  PUBLIC_DEMO_ENABLED: z.coerce.boolean().default(false),
  WHATSAPP_PROVIDER: z.enum(["mock", "cloud_api", "none"]).default("none"),
  WHATSAPP_CLOUD_API_TOKEN: z.string().optional(),
  WHATSAPP_CLOUD_PHONE_ID: z.string().optional(),
  WHATSAPP_CLOUD_API_VERSION: z.string().default("v23.0"),
  WHATSAPP_CLOUD_API_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_CLOUD_API_APP_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_ALLOWED_ORIGINS: z.string().optional(),
  MERCADO_PAGO_ENABLED: z.coerce.boolean().default(false),
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  PUBLIC_URL: z.string().default("http://localhost:5173"),
  APP_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_DSN_API: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default("development"),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().default(0.1),
  WORKER_REMINDERS_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
  WORKER_RECONCILE_INTERVAL_SECONDS: z.coerce.number().int().positive().default(300),
  WORKER_CLEANUP_INTERVAL_SECONDS: z.coerce.number().int().positive().default(900)
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  DIRECT_URL: parsedEnv.DIRECT_URL ?? parsedEnv.DATABASE_URL,
  LOG_LEVEL: parsedEnv.LOG_LEVEL ?? (parsedEnv.NODE_ENV === "production" ? "info" : "debug"),
  API_BASE_URL: parsedEnv.API_BASE_URL ?? parsedEnv.PUBLIC_URL,
  SENTRY_DSN_API: parsedEnv.SENTRY_DSN_API ?? parsedEnv.SENTRY_DSN
};
