import { prisma } from "../lib/prisma.js";
import { addHours, addMinutes, isWithinInterval } from "date-fns";
import { EmailFallbackProvider, MockWhatsAppProvider } from "../modules/messaging/provider.js";

const now = new Date();
const provider = new MockWhatsAppProvider();
const email = new EmailFallbackProvider();

const appointments = await prisma.appointment.findMany({ where: { status: "confirmed", startAt: { gte: now, lte: addHours(now, 25) } }, include: { workspace: true, service: true, staffMember: true, client: true } });

for (const appt of appointments) {
  const windows = [
    { type: "reminder_24h", target: addHours(now, 24) },
    { type: "reminder_2h", target: addHours(now, 2) }
  ];

  for (const w of windows) {
    if (!isWithinInterval(appt.startAt, { start: addMinutes(w.target, -5), end: addMinutes(w.target, 5) })) continue;
    const exists = await prisma.reminderLog.findUnique({ where: { appointmentId_type: { appointmentId: appt.id, type: w.type } } });
    if (exists) continue;
    const res = appt.client.whatsappOptInAt
      ? await provider.sendTemplate({ to: appt.client.whatsapp, templateName: w.type, language: "pt_BR", variables: { businessName: appt.workspace.name, serviceName: appt.service.name, date: appt.startAt.toLocaleDateString("pt-BR"), time: appt.startAt.toLocaleTimeString("pt-BR"), staffName: appt.staffMember.name, address: appt.workspace.address ?? "", cancelLink: `${process.env.PUBLIC_URL}/cancel/${appt.cancelToken}`, rescheduleLink: `${process.env.PUBLIC_URL}/reschedule/${appt.id}` } })
      : await email.sendTemplate({ to: appt.client.email ?? "", templateName: w.type, language: "pt_BR", variables: {} });
    await prisma.reminderLog.create({ data: { appointmentId: appt.id, type: w.type, provider: res.provider, status: res.status, response: res.response } });
  }
}
