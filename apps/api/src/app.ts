import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { captureRequestError } from "./instrument.js";
import authPlugin from "./plugins/auth.js";
import tenantPlugin from "./plugins/tenant.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { appointmentRoutes } from "./modules/appointments/routes.js";
import { authRoutes } from "./modules/auth/routes.js";
import { billingRoutes } from "./modules/billing/routes.js";
import { clientRoutes } from "./modules/clients/routes.js";
import { dashboardRoutes } from "./modules/dashboard/routes.js";
import { paymentRoutes } from "./modules/payments/routes.js";
import { publicRoutes } from "./modules/public/routes.js";
import { resourceRoutes } from "./modules/resources/routes.js";
import { serviceRoutes } from "./modules/services/routes.js";
import { staffRoutes } from "./modules/staff/routes.js";
import { waitlistRoutes } from "./modules/waitlist/routes.js";
import { workspaceRoutes } from "./modules/workspaces/routes.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL
    }
  });

  app.register(sensible);
  app.register(cors, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",")
  });
  app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute"
  });
  app.register(authPlugin);
  app.register(tenantPlugin);

  app.setErrorHandler((error, req, reply) => {
    const message = error instanceof Error ? error.message : "Erro interno inesperado.";
    const statusCode = typeof error === "object" && error && "statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500;

    if (message === "FORBIDDEN") {
      return reply.code(403).send({ message: "Permissao insuficiente para esta acao." });
    }

    if (statusCode >= 500) {
      captureRequestError(error, req);
    }

    app.log.error(error);
    return reply.code(statusCode).send({ message });
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "belezafoco-api",
    timestamp: new Date().toISOString()
  }));

  app.get("/ready", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready" };
    } catch (error) {
      app.log.error(error);
      return reply.code(503).send({ status: "not_ready" });
    }
  });

  app.register(authRoutes);
  app.register(workspaceRoutes);
  app.register(serviceRoutes);
  app.register(staffRoutes);
  app.register(resourceRoutes);
  app.register(clientRoutes);
  app.register(appointmentRoutes);
  app.register(publicRoutes);
  app.register(waitlistRoutes);
  app.register(paymentRoutes);
  app.register(billingRoutes);
  app.register(dashboardRoutes);

  return app;
}
