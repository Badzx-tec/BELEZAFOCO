import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type Redis from "ioredis";
import { PrismaService } from "../database/prisma.service";
import { REDIS_CLIENT } from "../redis/redis.provider";

@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null
  ) {}

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
    let prismaStatus = "ready";
    let redisStatus = this.redis ? "ready" : "not-configured";

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      prismaStatus = "down";
    }

    if (this.redis) {
      try {
        await this.redis.ping();
      } catch {
        redisStatus = "down";
      }
    }

    const ok = prismaStatus === "ready" && redisStatus !== "down";
    const result = {
      ok,
      checks: { api: "ready", prisma: prismaStatus, redis: redisStatus },
      timestamp: new Date().toISOString()
    };

    if (!ok) {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
