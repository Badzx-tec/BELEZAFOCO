import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

const REMINDER_CHANNELS = ["email"] as const;
const LEAD_TIMES_MS = [24 * 60 * 60 * 1000, 2 * 60 * 60 * 1000] as const; // 24h, 2h

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async scheduleForAppointment(workspaceId: string, appointmentId: string, startsAt: Date) {
    const jobs = [];
    for (const channel of REMINDER_CHANNELS) {
      for (const leadTimeMs of LEAD_TIMES_MS) {
        const scheduledFor = new Date(startsAt.getTime() - leadTimeMs);
        if (scheduledFor <= new Date()) continue; // already past — skip
        jobs.push({ workspaceId, appointmentId, channel, scheduledFor });
      }
    }
    if (jobs.length === 0) return;
    try {
      await this.prisma.reminderJob.createMany({ data: jobs, skipDuplicates: true });
      this.logger.log(`Scheduled ${jobs.length} reminder(s) for appointment ${appointmentId}`);
    } catch (err) {
      this.logger.error(`Failed to schedule reminders for ${appointmentId}`, err);
    }
  }

  async cancelForAppointment(appointmentId: string) {
    await this.prisma.reminderJob.updateMany({
      where: { appointmentId, status: "scheduled" },
      data: { status: "cancelled" }
    });
  }
}
