import { addHours, addMinutes, isWithinInterval } from "date-fns";
import { pathToFileURL } from "node:url";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { EmailNotificationProvider, buildMessagingProvider } from "../modules/messaging/provider.js";

export async function runSendRemindersJob(now = new Date()) {
  const provider = buildMessagingProvider();
  const email = new EmailNotificationProvider();
  let remindersCreated = 0;
  let whatsappSent = 0;
  let emailSent = 0;
  let skipped = 0;

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

  const templates = await prisma.messageTemplate.findMany({
    where: {
      workspaceId: {
        in: [...new Set(appointments.map((appointment) => appointment.workspaceId))]
      }
    }
  });

  const templateMap = new Map(templates.map((template) => [`${template.workspaceId}:${template.type}`, template] as const));

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
      if (exists) {
        skipped += 1;
        continue;
      }

      const template = templateMap.get(`${appointment.workspaceId}:${window.type}`);
      const payload = {
        templateName: template?.templateName ?? window.type,
        language: template?.language ?? "pt_BR",
        variables: {
          clientName: appointment.client.name,
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

      remindersCreated += 1;
      if (response.provider === "email") {
        emailSent += 1;
      } else if (response.status === "sent") {
        whatsappSent += 1;
      }
    }
  }

  return {
    remindersCreated,
    whatsappSent,
    emailSent,
    skipped
  };
}

if (isDirectExecution()) {
  await runSendRemindersJob();
  await prisma.$disconnect();
}

function isDirectExecution() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}
