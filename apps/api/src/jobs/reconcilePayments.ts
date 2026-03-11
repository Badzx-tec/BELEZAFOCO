import { prisma } from "../lib/prisma.js";

const pending = await prisma.payment.findMany({
  where: { status: "pending" },
  include: { appointment: true }
});

for (const payment of pending) {
  if (!payment.expiresAt || payment.expiresAt.getTime() > Date.now()) continue;

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
        cancelledAt: new Date()
      }
    });
  });
}
