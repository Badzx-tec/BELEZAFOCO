import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { addDays } from "date-fns";
import { env } from "../config/env.js";
import { sha256 } from "../lib/crypto.js";
import { prisma } from "../lib/prisma.js";
import type { AppRole } from "../lib/types.js";

type SessionMeta = {
  userId: string;
  workspaceId: string;
  role: AppRole;
  ipAddress?: string;
  userAgent?: string;
};

export default fp(async (app) => {
  const fastifyJwt = app as typeof app & {
    accessJwt: { sign: (payload: object, options?: { expiresIn?: string }) => string };
    refreshJwt: { sign: (payload: object) => string; verify: (token: string) => Promise<{ sub: string }> | { sub: string } };
  };

  await app.register(jwt, { secret: env.JWT_ACCESS_SECRET, namespace: "access" });
  await app.register(jwt, { secret: env.JWT_REFRESH_SECRET, namespace: "refresh" });

  app.decorate("authenticate", async (request: any) => {
    await request.accessJwtVerify();
  });

  app.decorate("issueSession", async (meta: SessionMeta) => {
    const accessToken = fastifyJwt.accessJwt.sign(
      {
        sub: meta.userId,
        workspaceId: meta.workspaceId,
        role: meta.role
      },
      { expiresIn: env.JWT_ACCESS_TTL }
    );

    const refreshToken = fastifyJwt.refreshJwt.sign({ sub: meta.userId });
    await prisma.refreshToken.create({
      data: {
        tokenHash: sha256(refreshToken),
        userId: meta.userId,
        expiresAt: addDays(new Date(), env.JWT_REFRESH_TTL_DAYS)
      }
    });

    return { accessToken, refreshToken };
  });

  app.decorate("verifyRefreshToken", async (token: string) => {
    return fastifyJwt.refreshJwt.verify(token);
  });
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: any) => Promise<void>;
    issueSession: (meta: SessionMeta) => Promise<{ accessToken: string; refreshToken: string }>;
    verifyRefreshToken: (token: string) => Promise<{ sub: string }>;
  }
}
