import { prisma } from "../lib/prisma.js";

const pending = await prisma.payment.findMany({ where: { status: "pending" }, include: { appointment: true } });
for (const p of pending) {
  if (Date.now() - p.createdAt.getTime() > 30 * 60 * 1000) {
    await prisma.payment.update({ where: { id: p.id }, data: { status: "failed" } });
    await prisma.appointment.update({ where: { id: p.appointmentId }, data: { status: "cancelled", depositStatus: "failed" } });
  }
}
