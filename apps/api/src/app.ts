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
import { env } from "./config/env.js";

export function buildApp() {
  const app = Fastify({ logger: { level: "info" } });
  app.register(sensible);
  app.register(cors, { origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",") });
  app.register(rateLimit, { global: true, max: 100, timeWindow: "1 minute" });
  app.register(authPlugin);
  app.register(tenantPlugin);

  app.get("/health", async () => ({ status: "ok" }));
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

  return app;
}
