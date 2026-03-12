import {
  Controller,
  Get,
  ServiceUnavailableException
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("live")
  live() {
    return {
      ok: true,
      service: "api",
      timestamp: new Date().toISOString()
    };
  }

  @Get("ready")
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        ok: false,
        checks: {
          api: "ready",
          prisma: "down",
          redis: "pending-wiring"
        },
        timestamp: new Date().toISOString()
      });
    }

    return {
      ok: true,
      checks: {
        api: "ready",
        prisma: "ready",
        redis: "pending-wiring"
      },
      timestamp: new Date().toISOString()
    };
  }
}
