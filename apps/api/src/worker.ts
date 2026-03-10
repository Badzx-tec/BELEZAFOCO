import "./instrument.js";
import pino from "pino";
import { env } from "./config/env.js";
import { runCleanupJob } from "./jobs/cleanup.js";
import { runReconcilePaymentsJob } from "./jobs/reconcilePayments.js";
import { runSendRemindersJob } from "./jobs/sendReminders.js";
import { captureWorkerError, flushSentry } from "./instrument.js";
import { prisma } from "./lib/prisma.js";

type WorkerJobDefinition = {
  name: string;
  intervalSeconds: number;
  run: () => Promise<Record<string, number>>;
};

const logger = pino({
  name: "belezafoco-worker",
  level: env.LOG_LEVEL
});

const jobs: WorkerJobDefinition[] = [
  {
    name: "send-reminders",
    intervalSeconds: env.WORKER_REMINDERS_INTERVAL_SECONDS,
    run: runSendRemindersJob
  },
  {
    name: "reconcile-payments",
    intervalSeconds: env.WORKER_RECONCILE_INTERVAL_SECONDS,
    run: runReconcilePaymentsJob
  },
  {
    name: "cleanup",
    intervalSeconds: env.WORKER_CLEANUP_INTERVAL_SECONDS,
    run: runCleanupJob
  }
];

let stopping = false;
const timers = jobs.map(scheduleJob);

logger.info(
  {
    jobs: jobs.map((job) => ({
      name: job.name,
      intervalSeconds: job.intervalSeconds
    }))
  },
  "Worker iniciado."
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void shutdown(signal, 0);
  });
}

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Worker recebeu uncaughtException.");
  captureWorkerError(error, { job: "process", extra: { lifecycle: "uncaughtException" } });
  void shutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Worker recebeu unhandledRejection.");
  captureWorkerError(reason, { job: "process", extra: { lifecycle: "unhandledRejection" } });
  void shutdown("unhandledRejection", 1);
});

function scheduleJob(job: WorkerJobDefinition) {
  let running = false;

  const tick = async () => {
    if (stopping) return;
    if (running) {
      logger.warn({ job: job.name }, "Execucao anterior ainda em andamento. Ciclo ignorado.");
      return;
    }

    running = true;
    const startedAt = Date.now();

    try {
      const result = await job.run();
      logger.info(
        {
          job: job.name,
          durationMs: Date.now() - startedAt,
          result
        },
        "Job executado."
      );
    } catch (error) {
      logger.error({ err: error, job: job.name }, "Job falhou.");
      captureWorkerError(error, { job: job.name, extra: { intervalSeconds: job.intervalSeconds } });
    } finally {
      running = false;
    }
  };

  void tick();
  const timer = setInterval(() => {
    void tick();
  }, job.intervalSeconds * 1000);
  timer.unref();
  return timer;
}

async function shutdown(signal: string, exitCode: number) {
  if (stopping) return;
  stopping = true;

  for (const timer of timers) {
    clearInterval(timer);
  }

  logger.info({ signal }, "Encerrando worker.");
  await prisma.$disconnect();
  await flushSentry();
  process.exit(exitCode);
}
