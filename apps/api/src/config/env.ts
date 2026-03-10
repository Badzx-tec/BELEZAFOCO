import "../lib/loadEnv.js";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/belezafoco"),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"),
  SUPERADMIN_EMAIL: z.string().email().optional(),
  WHATSAPP_PROVIDER: z.enum(["mock", "cloud_api", "none"]).default("mock"),
  WHATSAPP_CLOUD_API_TOKEN: z.string().optional(),
  WHATSAPP_CLOUD_PHONE_ID: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MERCADO_PAGO_ENABLED: z.coerce.boolean().default(false),
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  PUBLIC_URL: z.string().default("http://localhost:5173"),
  APP_URL: z.string().default("http://localhost:5173"),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  WORKER_REMINDERS_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
  WORKER_RECONCILE_INTERVAL_SECONDS: z.coerce.number().int().positive().default(300),
  WORKER_CLEANUP_INTERVAL_SECONDS: z.coerce.number().int().positive().default(900)
});

export const env = envSchema.parse(process.env);
