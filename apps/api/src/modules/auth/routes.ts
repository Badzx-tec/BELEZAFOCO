import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import {
  authenticateWithGoogle,
  findRefreshTokenRecord,
  getMe,
  getPublicAuthConfig,
  issueSession,
  loginWithPassword,
  registerWithPassword,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyEmailToken
} from "./service.js";

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

const emailSchema = z.object({
  email: z.string().email()
});

const tokenSchema = z.object({
  token: z.string().min(20)
});

const resetPasswordSchema = tokenSchema.extend({
  password: z.string().min(8)
});

const googleSchema = z.object({
  credential: z.string().min(20),
  workspaceName: z.string().min(2).optional(),
  slug: z.string().min(3).optional(),
  whatsapp: z.string().optional(),
  timezone: z.string().default("America/Sao_Paulo")
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get("/auth/config", async () => getPublicAuthConfig());

  app.post("/auth/register", async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const result = await registerWithPassword(app, body);
    return reply.code(201).send(result);
  });

  app.post("/auth/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const result = await loginWithPassword(app, body.email, body.password);

    if ("blocked" in result && result.blocked) {
      return reply.code(403).send(result);
    }

    return result;
  });

  app.post("/auth/google", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req) => {
    const body = googleSchema.parse(req.body);
    return authenticateWithGoogle(app, body);
  });

  app.post("/auth/verify-email", async (req) => {
    const body = tokenSchema.parse(req.body);
    return verifyEmailToken(app, body.token);
  });

  app.post("/auth/resend-verification", async (req) => {
    const body = emailSchema.parse(req.body);
    return resendVerificationEmail(app, body.email);
  });

  app.post("/auth/request-password-reset", async (req) => {
    const body = emailSchema.parse(req.body);
    return requestPasswordReset(app, body.email);
  });

  app.post("/auth/reset-password", async (req) => {
    const body = resetPasswordSchema.parse(req.body);
    return resetPassword(app, body.token, body.password);
  });

  app.post("/auth/refresh", async (req) => {
    const body = refreshSchema.parse(req.body);
    let payload: { sub: string };

    try {
      payload = (app as any).refreshJwt.verify(body.refreshToken) as { sub: string };
    } catch {
      throw app.httpErrors.unauthorized("Refresh token invalido");
    }

    const record = await findRefreshTokenRecord(payload.sub, body.refreshToken);
    if (!record) {
      throw app.httpErrors.unauthorized("Sessao expirada");
    }

    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() }
    });

    return issueSession(app, payload.sub);
  });

  app.post("/auth/logout", async (req) => {
    const body = refreshSchema.parse(req.body);
    let payload: { sub: string };

    try {
      payload = (app as any).refreshJwt.verify(body.refreshToken) as { sub: string };
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
    return getMe((req.user as any).sub);
  });
};
