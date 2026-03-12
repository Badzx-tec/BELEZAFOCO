import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __belezafocoPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__belezafocoPrisma__ ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString:
        process.env.DIRECT_URL ??
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/belezafoco"
    }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__belezafocoPrisma__ = prisma;
}
