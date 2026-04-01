import { type Provider } from "@nestjs/common";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    return new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
  }
};
