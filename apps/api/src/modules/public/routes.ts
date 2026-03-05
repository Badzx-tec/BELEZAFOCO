import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { generateSlots } from "../../lib/scheduler.js";
import { addMinutes, startOfDay, endOfDay } from "date-fns";
import { env } from "../../config/env.js";
import { MercadoPagoProvider } from "../payments/provider.js";
import { randomUUID } from "node:crypto";

export const publicRoutes: FastifyPluginAsync = async (app) => {
  app.get("/public/b/:slug", async (req) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const ws = await prisma.workspace.findUniqueOrThrow({ where: { slug } });
    const services = await prisma.service.findMany({ where: { workspaceId: ws.id, active: true } });
    return { workspace: ws, services };
  });

  app.get("/public/b/:slug/slots", async (req) => {
    const q = z.object({ serviceId: z.string(), staffMemberId: z.string().optional(), date: z.string() }).parse(req.query);
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const ws = await prisma.workspace.findUniqueOrThrow({ where: { slug } });
    const service = await prisma.service.findFirstOrThrow({ where: { id: q.serviceId, workspaceId: ws.id } });
    const day = new Date(q.date);
    const staff = q.staffMemberId ? await prisma.staffMember.findUniqueOrThrow({ where: { id: q.staffMemberId } }) : await prisma.staffMember.findFirstOrThrow({ where: { workspaceId: ws.id } });
    const av = await prisma.staffAvailability.findFirstOrThrow({ where: { staffMemberId: staff.id, weekday: day.getDay() } });
    const [sh, sm] = av.startTime.split(":").map(Number);
    const [eh, em] = av.endTime.split(":").map(Number);
    const start = new Date(day); start.setHours(sh, sm, 0, 0);
    const end = new Date(day); end.setHours(eh, em, 0, 0);
    const existing = await prisma.appointment.findMany({ where: { workspaceId: ws.id, staffMemberId: staff.id, startAt: { gte: startOfDay(day), lte: endOfDay(day) }, status: { not: "cancelled" } } });
    const slots = generateSlots({ startAt: start, endAt: end, durationMinutes: service.durationMinutes, bufferBeforeMinutes: service.bufferBeforeMinutes, bufferAfterMinutes: service.bufferAfterMinutes, existing });
    return { slots: slots.map((s) => s.toISOString()), staffMemberId: staff.id };
  });

  app.post("/public/b/:slug/book", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (req) => {
    const body = z.object({ serviceId: z.string(), staffMemberId: z.string(), startAt: z.string(), name: z.string(), whatsapp: z.string(), email: z.string().email().optional(), whatsappOptIn: z.boolean(), policyAccepted: z.boolean() }).parse(req.body);
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const ws = await prisma.workspace.findUniqueOrThrow({ where: { slug } });
    const service = await prisma.service.findUniqueOrThrow({ where: { id: body.serviceId } });
    const client = await prisma.client.upsert({
      where: { workspaceId_whatsapp: { workspaceId: ws.id, whatsapp: body.whatsapp } },
      update: { name: body.name, email: body.email, whatsappOptInAt: body.whatsappOptIn ? new Date() : null, whatsappOptInIp: req.ip, whatsappOptInMethod: "public_form" },
      create: { workspaceId: ws.id, name: body.name, whatsapp: body.whatsapp, email: body.email, whatsappOptInAt: body.whatsappOptIn ? new Date() : null, whatsappOptInIp: req.ip, whatsappOptInMethod: "public_form" }
    });

    const startAt = new Date(body.startAt);
    const endAt = addMinutes(startAt, service.durationMinutes);
    const status = service.depositEnabled && env.MERCADO_PAGO_ENABLED ? "pending_payment" : "confirmed";
    const appt = await prisma.appointment.create({
      data: {
        workspaceId: ws.id,
        serviceId: service.id,
        staffMemberId: body.staffMemberId,
        resourceId: service.requiredResourceId,
        clientId: client.id,
        status,
        startAt,
        endAt,
        depositAmount: service.depositEnabled ? (service.depositType === "percent" ? Math.floor((service.priceValue ?? 0) * (service.depositValue ?? 0) / 100) : service.depositValue ?? 0) : null,
        depositProvider: service.depositEnabled ? "mercado_pago" : null,
        depositStatus: service.depositEnabled ? "pending" : null,
        cancelToken: randomUUID()
      }
    });

    if (status === "pending_payment") {
      const provider = new MercadoPagoProvider();
      const payment = await provider.createPixCharge({ amount: appt.depositAmount ?? 0, description: `Sinal ${service.name}`, payerName: client.name, payerEmail: client.email ?? undefined });
      await prisma.payment.create({ data: { appointmentId: appt.id, amount: appt.depositAmount ?? 0, provider: "mercado_pago", status: "pending", externalId: payment.externalId, qrCode: payment.qrCode, pixCopyPaste: payment.pixCopyPaste } });
      return { appointmentId: appt.id, status, payment };
    }

    return { appointmentId: appt.id, status };
  });
};
