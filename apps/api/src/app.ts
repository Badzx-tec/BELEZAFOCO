import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import authPlugin from "./plugins/auth.js";
import httpErrorsPlugin from "./plugins/http-errors.js";
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
import { messagingRoutes } from "./modules/messaging/routes.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { captureServerError, initSentry } from "./lib/sentry.js";
import { ZodError } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));

function resolveWebDist() {
  const candidates = [
    resolve(currentDir, "../../web/dist"),
    resolve(currentDir, "../../../web/dist")
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

export function buildApp() {
  const webDist = resolveWebDist();
  const cspDirectives = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    scriptSrc: ["'self'", "https://accounts.google.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    connectSrc: ["'self'", "https://*.ingest.sentry.io", "https://*.sentry.io", "https://accounts.google.com"],
    frameSrc: ["'self'", "https://accounts.google.com"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    workerSrc: ["'self'", "blob:"],
    ...(env.NODE_ENV === "production" ? { upgradeInsecureRequests: [] } : {})
  };
  const app = Fastify({
    trustProxy: env.NODE_ENV === "production",
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
    logger: {
      level: env.LOG_LEVEL
    }
  });

  app.register(httpErrorsPlugin);
  app.register(cors, {
    origin:
      env.CORS_ORIGIN === "*"
        ? true
        : env.CORS_ORIGIN
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
  });
  app.register(rateLimit, { global: true, max: 100, timeWindow: "1 minute" });
  app.register(helmet, {
    global: true,
    contentSecurityPolicy: webDist
      ? {
          directives: cspDirectives
        }
      : false,
    hsts:
      env.NODE_ENV === "production"
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          }
        : false
  });
  app.register(authPlugin);
  app.register(tenantPlugin);
  initSentry(app);

  app.setErrorHandler((error, req, reply) => {
    captureServerError(error, req);

    if (error instanceof ZodError) {
      reply.code(400).send({
        message: "Dados inválidos",
        issues: error.flatten()
      });
      return;
    }

    if ((error as any).statusCode) {
      reply.code((error as any).statusCode).send({ message: error instanceof Error ? error.message : "Erro na requisição" });
      return;
    }

    app.log.error(error);
    reply.code(500).send({ message: "Erro interno do servidor" });
  });

  const basicHealthHandler = async () => ({ status: "ok" });
  const readinessHandler = async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ready" };
  };

  app.get("/health", basicHealthHandler);
  app.get("/healthz", basicHealthHandler);
  app.get("/ready", readinessHandler);
  app.get("/readyz", readinessHandler);

  app.register(authRoutes);
  app.register(workspaceRoutes);
  app.register(serviceRoutes);
  app.register(staffRoutes);
  app.register(resourceRoutes);
  app.register(publicRoutes);
  app.register(appointmentRoutes);
  app.register(waitlistRoutes);
  app.register(paymentRoutes);
  app.register(messagingRoutes);
  app.register(billingRoutes);
  app.register(clientRoutes);
  app.register(dashboardRoutes);

  if (webDist) {
    app.register(fastifyStatic, {
      root: webDist,
      wildcard: false,
      index: false
    });

    const spaEntry = async (_request: unknown, reply: any) => {
      reply.header("Cache-Control", "no-store, must-revalidate");
      return reply.sendFile("index.html");
    };

    app.get("/", spaEntry);
    app.get("/auth", spaEntry);
    app.get("/auth/verify-email", spaEntry);
    app.get("/auth/reset-password", spaEntry);
    app.get("/app", spaEntry);
    app.get("/app/*", spaEntry);
    app.get("/b/*", spaEntry);
  }

  return app;
}
