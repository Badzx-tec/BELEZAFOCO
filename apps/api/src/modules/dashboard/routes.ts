import { FastifyPluginAsync } from "fastify";
import { endOfDay, startOfDay, startOfMonth } from "date-fns";
import { prisma } from "../../lib/prisma.js";
import { requireRole } from "../../lib/permissions.js";

function sumPrice(appointments: Array<{ service: { priceValue: number | null } }>) {
  return appointments.reduce((total, item) => total + (item.service.priceValue ?? 0), 0);
}

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/dashboard/summary", async (req) => {
    requireRole(app, req, ["staff"]);

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);

    const [appointments, clients, businessHours, activeStaff] = await Promise.all([
      prisma.appointment.findMany({
        where: { workspaceId: req.workspaceId, startAt: { gte: monthStart } },
        include: { service: true, staffMember: true, client: true },
        orderBy: { startAt: "asc" }
      }),
      prisma.client.findMany({
        where: { workspaceId: req.workspaceId },
        include: { appointments: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.businessHour.findMany({ where: { workspaceId: req.workspaceId } }),
      prisma.staffMember.count({ where: { workspaceId: req.workspaceId, active: true } })
    ]);

    const todayAppointments = appointments.filter((item) => item.startAt >= todayStart && item.startAt <= todayEnd);
    const upcoming = todayAppointments.filter((item) => item.status !== "cancelled");
    const cancelled = appointments.filter((item) => item.status === "cancelled" || item.status === "late_cancel");
    const noShows = appointments.filter((item) => item.status === "no_show");
    const confirmedRevenue = sumPrice(appointments.filter((item) => item.status === "confirmed" || item.status === "done"));
    const predictedRevenue = sumPrice(appointments.filter((item) => item.status !== "cancelled"));
    const newClients = clients.filter((item) => item.createdAt >= monthStart).length;
    const recurringClients = clients.filter((item) => item.appointments.length >= 2).length;

    const dailyCapacityMinutes =
      businessHours.reduce((total, item) => {
        const [startHour, startMinute] = item.startTime.split(":").map(Number);
        const [endHour, endMinute] = item.endTime.split(":").map(Number);
        return total + (endHour * 60 + endMinute - (startHour * 60 + startMinute));
      }, 0) * Math.max(activeStaff, 1);

    const bookedMinutesToday = todayAppointments.reduce((total, item) => total + (item.service.durationMinutes ?? 0), 0);
    const occupancyRate = dailyCapacityMinutes > 0 ? Math.round((bookedMinutesToday / dailyCapacityMinutes) * 100) : 0;

    const topServices = Object.values(
      appointments.reduce<Record<string, { serviceId: string; name: string; count: number }>>((acc, item) => {
        const key = item.serviceId;
        if (!acc[key]) acc[key] = { serviceId: item.serviceId, name: item.service.name, count: 0 };
        acc[key].count += 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topStaff = Object.values(
      appointments.reduce<Record<string, { staffMemberId: string; name: string; count: number }>>((acc, item) => {
        const key = item.staffMemberId;
        if (!acc[key]) acc[key] = { staffMemberId: item.staffMemberId, name: item.staffMember.name, count: 0 };
        acc[key].count += 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      today: {
        appointments: upcoming.length,
        confirmed: todayAppointments.filter((item) => item.status === "confirmed").length,
        pendingPayment: todayAppointments.filter((item) => item.status === "pending_payment").length,
        occupancyRate
      },
      funnel: {
        cancelled: cancelled.length,
        noShows: noShows.length,
        newClients,
        recurringClients
      },
      revenue: {
        predicted: predictedRevenue,
        confirmed: confirmedRevenue
      },
      upcoming: upcoming.slice(0, 8).map((item) => ({
        id: item.id,
        startAt: item.startAt,
        status: item.status,
        clientName: item.client.name,
        serviceName: item.service.name,
        staffName: item.staffMember.name
      })),
      topServices,
      topStaff
    };
  });
};
