import pino from "pino";

const logger = pino({ name: "belezafoco-worker" });
const queueNames = ["appointment-reminders", "payment-reconciliation", "notification-retries"] as const;

async function bootstrap() {
  logger.info(
    {
      queues: queueNames,
      redisConfigured: Boolean(process.env.REDIS_URL)
    },
    "BELEZAFOCO worker scaffold booted"
  );
}

bootstrap().catch((error) => {
  logger.error({ error }, "Worker bootstrap failed");
  process.exitCode = 1;
});
