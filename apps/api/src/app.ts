import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import authPlugin from "./plugins/auth.js";
import tenantPlugin from "./plugins/tenant.js";
import { authRoutes } from "./modules/auth/routes.js";
import { workspaceRoutes } from "./modules/workspaces/routes.js";
import { serviceRoutes } from "./modules/services/routes.js";
import { staffRoutes } from "./modules/staff/routes.js";
import { resourceRoutes } from "./modules/resources/routes.js";
import { publicRoutes } from "./modules/public/routes.js";
import { appointmentRoutes } from "./modules/appointments/routes.js";
import { waitlistRoutes } from "./modules/waitlist/routes.js";
import { paymentRoutes } from "./modules/payments/routes.js";
import { billingRoutes } from "./modules/billing/routes.js";
import { clientRoutes } from "./modules/clients/routes.js";
import { dashboardRoutes } from "./modules/dashboard/routes.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { ZodError } from "zod";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  app.register(sensible);
  app.register(cors, { origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",") });
  app.register(rateLimit, { global: true, max: 100, timeWindow: "1 minute" });
  app.register(authPlugin);
  app.register(tenantPlugin);

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      reply.code(400).send({
        message: "Dados inválidos",
        issues: error.flatten()
      });
      return;
    }

    if ((error as any).statusCode) {
      reply.code((error as any).statusCode).send({ message: error.message });
      return;
    }

    app.log.error(error);
    reply.code(500).send({ message: "Erro interno do servidor" });
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ready" };
  });

  app.register(authRoutes);
  app.register(workspaceRoutes);
  app.register(serviceRoutes);
  app.register(staffRoutes);
  app.register(resourceRoutes);
  app.register(publicRoutes);
  app.register(appointmentRoutes);
  app.register(waitlistRoutes);
  app.register(paymentRoutes);
  app.register(billingRoutes);
  app.register(clientRoutes);
  app.register(dashboardRoutes);

  return app;
}
