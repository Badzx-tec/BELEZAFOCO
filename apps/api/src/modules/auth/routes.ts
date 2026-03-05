import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import argon2 from "argon2";

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(2), workspaceName: z.string(), slug: z.string() });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/register", async (req, reply) => {
    const body = registerSchema.parse(req.body);
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
                slug: body.slug,
                subscription: { create: { plan: "trial", paidUntil: new Date(Date.now() + 14 * 86400000) } }
              }
            }
          }
        }
      },
      include: { memberships: true }
    });
    return reply.code(201).send({ userId: created.id });
  });

  app.post("/auth/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email }, include: { memberships: { include: { workspace: true } } } });
    if (!user || !(await argon2.verify(user.passwordHash, body.password))) throw app.httpErrors.unauthorized("Credenciais inválidas");
    const accessToken = app.accessJwt.sign({ sub: user.id });
    const refreshToken = app.refreshJwt.sign({ sub: user.id });
    return { accessToken, refreshToken, workspaces: user.memberships.map((m) => ({ id: m.workspaceId, role: m.role, name: m.workspace.name })) };
  });
};
