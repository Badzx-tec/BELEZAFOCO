import * as Sentry from "@sentry/node";
import pino from "pino";

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE ?? undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    sendDefaultPii: false
  });
}

const logger = pino({ name: "belezafoco-worker" });
const queueNames = ["appointment-reminders", "payment-reconciliation", "notification-retries"] as const;

async function bootstrap() {
  logger.info(
    {
      queues: queueNames,
      redisConfigured: Boolean(process.env.REDIS_URL),
      sentryConfigured: Boolean(dsn)
    },
    "BELEZAFOCO worker scaffold booted"
  );
}

bootstrap().catch((error) => {
  logger.error({ error }, "Worker bootstrap failed");
  Sentry.captureException(error);
  process.exitCode = 1;
});
