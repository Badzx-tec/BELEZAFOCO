import { addHours, addMinutes, isWithinInterval } from "date-fns";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { EmailNotificationProvider, buildMessagingProvider } from "../modules/messaging/provider.js";

const now = new Date();
const provider = buildMessagingProvider();
const email = new EmailNotificationProvider();

const appointments = await prisma.appointment.findMany({
  where: {
    status: "confirmed",
    startAt: { gte: now, lte: addHours(now, 25) }
  },
  include: {
    workspace: true,
    service: true,
    staffMember: true,
    client: true
  }
});

for (const appointment of appointments) {
  const windows = [
    { type: "reminder_24h", target: addHours(now, 24) },
    { type: "reminder_2h", target: addHours(now, 2) }
  ];

  for (const window of windows) {
    if (!isWithinInterval(appointment.startAt, { start: addMinutes(window.target, -5), end: addMinutes(window.target, 5) })) {
      continue;
    }

    const exists = await prisma.reminderLog.findUnique({
      where: { appointmentId_type: { appointmentId: appointment.id, type: window.type } }
    });
    if (exists) continue;

    const payload = {
      templateName: window.type,
      language: "pt_BR",
      variables: {
        businessName: appointment.workspace.name,
        serviceName: appointment.service.name,
        date: appointment.startAt.toLocaleDateString("pt-BR"),
        time: appointment.startAt.toLocaleTimeString("pt-BR"),
        staffName: appointment.staffMember.name,
        address: appointment.workspace.address ?? "",
        cancelLink: `${env.PUBLIC_URL}/cancel/${appointment.cancelToken}`,
        rescheduleLink: `${env.PUBLIC_URL}/reschedule/${appointment.id}`
      }
    };

    let response =
      appointment.client.whatsappOptInAt && appointment.client.whatsapp
        ? await provider.sendTemplate({
            to: appointment.client.whatsapp,
            ...payload
          })
        : { status: "failed" as const, provider: "whatsapp_skipped", response: "Cliente sem opt-in de WhatsApp" };

    if (response.status === "failed" && appointment.client.email) {
      response = await email.sendTemplate({
        to: appointment.client.email,
        ...payload
      });
    }

    await prisma.reminderLog.create({
      data: {
        appointmentId: appointment.id,
        type: window.type,
        provider: response.provider,
        status: response.status,
        response: response.response
      }
    });
  }
}
