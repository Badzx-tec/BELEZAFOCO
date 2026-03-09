import { addHours, addMinutes, isWithinInterval } from "date-fns";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { EmailFallbackProvider, MockWhatsAppProvider } from "../modules/messaging/provider.js";

const now = new Date();
const provider = new MockWhatsAppProvider();
const email = new EmailFallbackProvider();

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

    const response = appointment.client.whatsappOptInAt
      ? await provider.sendTemplate({
          to: appointment.client.whatsapp,
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
        })
      : await email.sendTemplate({
          to: appointment.client.email ?? "",
          templateName: window.type,
          language: "pt_BR",
          variables: {}
        });

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
