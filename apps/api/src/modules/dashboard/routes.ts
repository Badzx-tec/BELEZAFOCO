import { FastifyPluginAsync } from "fastify";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/dashboard", async (req) => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [workspace, subscription, todayAppointments, monthAppointments, serviceCount, staffCount, clientCount, templatesCount] = await Promise.all([
      prisma.workspace.findUniqueOrThrow({ where: { id: req.workspaceId } }),
      prisma.workspaceSubscription.findUniqueOrThrow({ where: { workspaceId: req.workspaceId } }),
      prisma.appointment.findMany({
        where: {
          workspaceId: req.workspaceId,
          startAt: { gte: todayStart, lte: todayEnd }
        },
        include: {
          service: true,
          staffMember: true,
          client: true
        },
        orderBy: { startAt: "asc" }
      }),
      prisma.appointment.findMany({
        where: {
          workspaceId: req.workspaceId,
          startAt: { gte: monthStart, lte: monthEnd }
        },
        include: {
          service: true,
          staffMember: true
        }
      }),
      prisma.service.count({ where: { workspaceId: req.workspaceId, active: true } }),
      prisma.staffMember.count({ where: { workspaceId: req.workspaceId, active: true } }),
      prisma.client.count({ where: { workspaceId: req.workspaceId } }),
      prisma.messageTemplate.count({ where: { workspaceId: req.workspaceId, active: true } })
    ]);

    const confirmedMonth = monthAppointments.filter((appointment) => ["confirmed", "done"].includes(appointment.status));
    const noShowMonth = monthAppointments.filter((appointment) => appointment.status === "no_show").length;
    const cancelledMonth = monthAppointments.filter((appointment) => ["cancelled", "late_cancel"].includes(appointment.status)).length;
    const revenueConfirmed = confirmedMonth.reduce((sum, appointment) => sum + (appointment.priceAmount ?? appointment.service.priceValue ?? 0), 0);
    const revenuePipeline = monthAppointments
      .filter((appointment) => ["confirmed", "pending_payment"].includes(appointment.status))
      .reduce((sum, appointment) => sum + (appointment.priceAmount ?? appointment.service.priceValue ?? 0), 0);

    const topServices = aggregateTop(monthAppointments.map((appointment) => appointment.service.name));
    const topStaff = aggregateTop(monthAppointments.map((appointment) => appointment.staffMember.name));

    const checklist = [
      {
        key: "workspace_profile",
        label: "Identidade do negocio",
        done: Boolean(workspace.address && workspace.whatsapp && workspace.about)
      },
      {
        key: "business_hours",
        label: "Horarios de funcionamento",
        done: (await prisma.businessHour.count({ where: { workspaceId: req.workspaceId, isClosed: false } })) >= 5
      },
      {
        key: "service_catalog",
        label: "Catalogo de servicos",
        done: serviceCount > 0
      },
      {
        key: "team_setup",
        label: "Equipe",
        done: staffCount > 0
      },
      {
        key: "public_booking",
        label: "Pagina publica",
        done: workspace.publicBookingEnabled && templatesCount > 0
      }
    ];

    const occupancyRate = staffCount === 0 ? 0 : Math.min(100, Math.round((todayAppointments.filter((appointment) => appointment.status !== "cancelled").length / Math.max(staffCount * 8, 1)) * 100));

    return {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        publicUrl: `${env.PUBLIC_URL}/b/${workspace.slug}`,
        onboardingStep: workspace.onboardingStep,
        onboardingCompletedAt: workspace.onboardingCompletedAt
      },
      subscription,
      checklist,
      summary: {
        appointmentsToday: todayAppointments.length,
        confirmedToday: todayAppointments.filter((appointment) => appointment.status === "confirmed").length,
        noShowsMonth: noShowMonth,
        cancelledMonth,
        occupancyRate,
        serviceCount,
        staffCount,
        clientCount,
        revenuePipeline,
        revenueConfirmed
      },
      upcoming: todayAppointments.slice(0, 8).map((appointment) => ({
        id: appointment.id,
        clientName: appointment.client.name,
        serviceName: appointment.service.name,
        staffName: appointment.staffMember.name,
        status: appointment.status,
        startAt: appointment.startAt.toISOString()
      })),
      topServices,
      topStaff
    };
  });
};

function aggregateTop(items: string[]) {
  return Object.entries(items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {}))
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}
