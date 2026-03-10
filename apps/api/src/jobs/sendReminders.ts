import { addHours, addMinutes, isWithinInterval } from "date-fns";
import { pathToFileURL } from "node:url";
import { prisma } from "../lib/prisma.js";
import { EmailFallbackProvider, MockWhatsAppProvider } from "../modules/messaging/provider.js";

export async function runSendRemindersJob(now = new Date()) {
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

  let deliveriesCreated = 0;

  for (const appointment of appointments) {
    const windows = [
      { type: "reminder_24h", target: addHours(now, 24) },
      { type: "reminder_2h", target: addHours(now, 2) }
    ];

    for (const window of windows) {
      if (!isWithinInterval(appointment.startAt, { start: addMinutes(window.target, -5), end: addMinutes(window.target, 5) })) {
        continue;
      }

      const dedupeKey = `${appointment.id}:${window.type}`;
      const alreadySent = await prisma.messageDelivery.findUnique({
        where: { dedupeKey }
      });
      if (alreadySent) {
        continue;
      }

      const template = await prisma.messageTemplate.findFirst({
        where: {
          workspaceId: appointment.workspaceId,
          channel: appointment.client.whatsappOptInAt ? "whatsapp" : "email",
          type: window.type,
          active: true
        }
      });

      const result = appointment.client.whatsappOptInAt
        ? await provider.sendTemplate({
            to: appointment.client.whatsapp,
            templateName: template?.templateName ?? window.type,
            language: template?.language ?? "pt_BR",
            variables: {
              cliente: appointment.client.name,
              negocio: appointment.workspace.name,
              servico: appointment.service.name,
              data: appointment.startAt.toLocaleDateString("pt-BR"),
              hora: appointment.startAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              profissional: appointment.staffMember.name
            }
          })
        : await email.sendTemplate({
            to: appointment.client.email ?? "",
            templateName: template?.templateName ?? window.type,
            language: template?.language ?? "pt_BR",
            variables: {}
          });

      await prisma.messageDelivery.create({
        data: {
          workspaceId: appointment.workspaceId,
          appointmentId: appointment.id,
          clientId: appointment.clientId,
          channel: appointment.client.whatsappOptInAt ? "whatsapp" : "email",
          type: window.type,
          provider: result.provider,
          dedupeKey,
          status: result.status,
          response: result.response,
          sentAt: result.status === "sent" ? new Date() : null
        }
      });
      deliveriesCreated += 1;
    }
  }

  return {
    appointmentsChecked: appointments.length,
    deliveriesCreated
  };
}

if (isDirectExecution()) {
  await runSendRemindersJob();
  await prisma.$disconnect();
}

function isDirectExecution() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}
