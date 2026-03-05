import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/payments/webhook/mercadopago", async (req) => {
    const body = z.object({ externalId: z.string(), status: z.enum(["paid", "failed"]) }).parse(req.body);
    const payment = await prisma.payment.findFirstOrThrow({ where: { externalId: body.externalId } });
    await prisma.payment.update({ where: { id: payment.id }, data: { status: body.status } });
    if (body.status === "paid") {
      await prisma.appointment.update({ where: { id: payment.appointmentId }, data: { status: "confirmed", depositStatus: "paid" } });
    }
    return { ok: true };
  });
};
