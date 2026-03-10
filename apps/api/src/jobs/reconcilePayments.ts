import { Prisma } from "@prisma/client";
import { pathToFileURL } from "node:url";
import { prisma } from "../lib/prisma.js";

export async function runReconcilePaymentsJob(now = new Date()) {
  const pending = await prisma.payment.findMany({
    where: {
      status: "pending",
      expiresAt: { lt: now }
    },
    include: {
      appointment: true
    }
  });

  for (const payment of pending) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "expired" }
      });

      await tx.appointment.update({
        where: { id: payment.appointmentId },
        data: {
          status: "cancelled",
          depositStatus: "expired",
          cancelledAt: now,
          cancelledReason: "Reserva cancelada por expiracao do sinal"
        }
      });

      await tx.appointmentSegment.deleteMany({
        where: { appointmentId: payment.appointmentId }
      });
    });
  }

  return {
    expiredPayments: pending.length
  };
}

if (isDirectExecution()) {
  await runReconcilePaymentsJob();
  await prisma.$disconnect();
}

function isDirectExecution() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}
