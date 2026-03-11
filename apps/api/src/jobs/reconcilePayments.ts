import { prisma } from "../lib/prisma.js";
import { pathToFileURL } from "node:url";

export async function runReconcilePaymentsJob(now = new Date()) {
  const pending = await prisma.payment.findMany({
    where: { status: "pending" },
    include: { appointment: true }
  });

  let paymentsFailed = 0;
  let appointmentsCancelled = 0;

  for (const payment of pending) {
    if (!payment.expiresAt || payment.expiresAt.getTime() > now.getTime()) continue;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "failed" }
      });

      await tx.appointment.update({
        where: { id: payment.appointmentId },
        data: {
          status: "cancelled",
          depositStatus: "failed",
          cancelledAt: now
        }
      });
    });

    paymentsFailed += 1;
    appointmentsCancelled += 1;
  }

  return {
    paymentsFailed,
    appointmentsCancelled
  };
}

if (isDirectExecution()) {
  await runReconcilePaymentsJob();
  await prisma.$disconnect();
}

function isDirectExecution() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}
