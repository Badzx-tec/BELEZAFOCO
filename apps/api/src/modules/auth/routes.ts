import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import argon2 from "argon2";
import { addDays } from "date-fns";
import { randomUUID } from "node:crypto";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  workspaceName: z.string().min(2),
  slug: z.string().min(3),
  whatsapp: z.string().optional(),
  timezone: z.string().default("America/Sao_Paulo")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function issueSession(app: any, userId: string) {
  const accessToken = app.accessJwt.sign({ sub: userId });
  const refreshToken = app.refreshJwt.sign({ sub: userId, jti: randomUUID() });
  const tokenHash = await argon2.hash(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: addDays(new Date(), 30)
    }
  });

  return { accessToken, refreshToken };
}

async function findRefreshTokenRecord(userId: string, refreshToken: string) {
  const tokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  for (const token of tokens) {
    if (await argon2.verify(token.tokenHash, refreshToken)) return token;
  }

  return null;
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/register", async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const slug = normalizeSlug(body.slug);
    const passwordHash = await argon2.hash(body.password);
    const trialEndsAt = addDays(new Date(), 14);

    const created = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        name: body.name,
        memberships: {
          create: {
            role: "owner",
            workspace: {
              create: {
                name: body.workspaceName,
                slug,
                timezone: body.timezone,
                whatsapp: body.whatsapp,
                businessHours: {
                  createMany: {
                    data: [
                      { weekday: 1, startTime: "09:00", endTime: "19:00" },
                      { weekday: 2, startTime: "09:00", endTime: "19:00" },
                      { weekday: 3, startTime: "09:00", endTime: "19:00" },
                      { weekday: 4, startTime: "09:00", endTime: "19:00" },
                      { weekday: 5, startTime: "09:00", endTime: "19:00" },
                      { weekday: 6, startTime: "09:00", endTime: "16:00" }
                    ]
                  }
                },
                subscription: {
                  create: {
                    plan: "trial",
                    status: "trialing",
                    paidUntil: trialEndsAt,
                    trialEndsAt
                  }
                }
              }
            }
          }
        }
      },
      include: { memberships: { include: { workspace: true } } }
    });

    const session = await issueSession(app, created.id);

    return reply.code(201).send({
      userId: created.id,
      ...session,
      workspaces: created.memberships.map((membership) => ({
        id: membership.workspaceId,
        role: membership.role,
        name: membership.workspace.name,
        slug: membership.workspace.slug
      }))
    });
  });

  app.post("/auth/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { memberships: { include: { workspace: true } } }
    });

    if (!user || !(await argon2.verify(user.passwordHash, body.password))) {
      throw app.httpErrors.unauthorized("Credenciais inválidas");
    }

    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        OR: [{ expiresAt: { lte: new Date() } }, { revokedAt: { not: null } }]
      }
    });

    const session = await issueSession(app, user.id);

    return {
      ...session,
      workspaces: user.memberships.map((membership) => ({
        id: membership.workspaceId,
        role: membership.role,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        timezone: membership.workspace.timezone
      }))
    };
  });

  app.post("/auth/refresh", async (req) => {
    const body = refreshSchema.parse(req.body);
    let payload: any;

    try {
      payload = (app as any).refreshJwt.verify(body.refreshToken);
    } catch {
      throw app.httpErrors.unauthorized("Refresh token inválido");
    }

    const record = await findRefreshTokenRecord(payload.sub, body.refreshToken);
    if (!record) throw app.httpErrors.unauthorized("Sessão expirada");

    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() }
    });

    return issueSession(app, payload.sub);
  });

  app.post("/auth/logout", async (req) => {
    const body = refreshSchema.parse(req.body);
    let payload: any;

    try {
      payload = (app as any).refreshJwt.verify(body.refreshToken);
    } catch {
      return { ok: true };
    }

    const record = await findRefreshTokenRecord(payload.sub, body.refreshToken);
    if (record) {
      await prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() }
      });
    }

    return { ok: true };
  });

  app.get("/auth/me", async (req) => {
    await app.auth(req as any);
    const userId = (req.user as any).sub;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { memberships: { include: { workspace: true } } }
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      workspaces: user.memberships.map((membership) => ({
        id: membership.workspaceId,
        role: membership.role,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        timezone: membership.workspace.timezone
      }))
    };
  });
};
