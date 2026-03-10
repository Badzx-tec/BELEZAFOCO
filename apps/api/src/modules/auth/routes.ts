import { FastifyPluginAsync } from "fastify";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { buildSubscriptionSeed } from "../../lib/plan.js";
import { slugify } from "../../lib/slug.js";
import { sha256 } from "../../lib/crypto.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  workspaceName: z.string().min(2),
  slug: z.string().min(2).optional(),
  whatsapp: z.string().min(8).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  workspaceId: z.string().optional()
});

const refreshSchema = z.object({
  refreshToken: z.string(),
  workspaceId: z.string().min(1)
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/register", async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const slug = slugify(body.slug ?? body.workspaceName);
    const existingWorkspace = await prisma.workspace.findUnique({ where: { slug } });
    if (existingWorkspace) {
      throw app.httpErrors.conflict("Slug publico indisponivel.");
    }

    const passwordHash = await argon2.hash(body.password);
    const created = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        memberships: {
          create: {
            role: "owner",
            workspace: {
              create: {
                name: body.workspaceName,
                slug,
                whatsapp: body.whatsapp,
                businessHours: {
                  createMany: {
                    data: [
                      { weekday: 0, startTime: "09:00", endTime: "18:00", isClosed: true },
                      { weekday: 1, startTime: "09:00", endTime: "19:00" },
                      { weekday: 2, startTime: "09:00", endTime: "19:00" },
                      { weekday: 3, startTime: "09:00", endTime: "19:00" },
                      { weekday: 4, startTime: "09:00", endTime: "19:00" },
                      { weekday: 5, startTime: "09:00", endTime: "19:00" },
                      { weekday: 6, startTime: "09:00", endTime: "17:00" }
                    ]
                  }
                },
                templates: {
                  createMany: {
                    data: [
                      {
                        channel: "whatsapp",
                        type: "confirmation",
                        templateName: "confirmacao_belezafoco",
                        language: "pt_BR",
                        body: "Oi {{cliente}}, seu horario para {{servico}} foi confirmado para {{data_hora}}."
                      },
                      {
                        channel: "whatsapp",
                        type: "reminder_24h",
                        templateName: "lembrete_24h_belezafoco",
                        language: "pt_BR",
                        body: "Lembrete: voce tem {{servico}} amanhã as {{hora}}."
                      }
                    ]
                  }
                },
                subscription: {
                  create: buildSubscriptionSeed("trial")
                }
              }
            }
          }
        }
      },
      include: {
        memberships: {
          include: { workspace: true }
        }
      }
    });

    const membership = created.memberships[0];
    const session = await app.issueSession({
      userId: created.id,
      workspaceId: membership.workspaceId,
      role: membership.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return reply.code(201).send({
      user: { id: created.id, name: created.name, email: created.email },
      workspaces: created.memberships.map((item) => ({
        id: item.workspaceId,
        name: item.workspace.name,
        slug: item.workspace.slug,
        role: item.role
      })),
      activeWorkspaceId: membership.workspaceId,
      ...session
    });
  });

  app.post("/auth/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: {
        memberships: {
          include: { workspace: true },
          orderBy: { joinedAt: "asc" }
        }
      }
    });

    if (!user || !(await argon2.verify(user.passwordHash, body.password))) {
      throw app.httpErrors.unauthorized("Credenciais invalidas.");
    }

    const membership = user.memberships.find((item) => item.workspaceId === body.workspaceId) ?? user.memberships[0];
    if (!membership) {
      throw app.httpErrors.forbidden("Usuario sem workspace vinculado.");
    }

    const session = await app.issueSession({
      userId: user.id,
      workspaceId: membership.workspaceId,
      role: membership.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      workspaces: user.memberships.map((item) => ({
        id: item.workspaceId,
        name: item.workspace.name,
        slug: item.workspace.slug,
        role: item.role
      })),
      activeWorkspaceId: membership.workspaceId,
      ...session
    };
  });

  app.post("/auth/refresh", async (req) => {
    const body = refreshSchema.parse(req.body);
    const payload = await app.verifyRefreshToken(body.refreshToken);
    const userId = payload.sub;
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(body.refreshToken) }
    });

    if (!stored || stored.userId !== userId || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw app.httpErrors.unauthorized("Refresh token invalido.");
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: body.workspaceId
        }
      }
    });

    if (!membership) {
      throw app.httpErrors.forbidden("Workspace nao vinculado ao usuario.");
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    });

    return app.issueSession({
      userId,
      workspaceId: membership.workspaceId,
      role: membership.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
  });

  app.post("/auth/logout", async (req) => {
    const body = z.object({ refreshToken: z.string() }).parse(req.body);
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: sha256(body.refreshToken),
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
    return { ok: true };
  });

  app.get("/auth/me", async (req) => {
    await app.authenticate(req as never);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: (req.user as any).sub as string },
      include: {
        memberships: {
          include: { workspace: true }
        }
      }
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      workspaces: user.memberships.map((item) => ({
        id: item.workspaceId,
        name: item.workspace.name,
        slug: item.workspace.slug,
        role: item.role
      }))
    };
  });
};
