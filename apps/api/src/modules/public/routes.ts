import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import {
  createDemoPublicBookingResponse,
  createDemoPublicSlotsResponse,
  demoPublicWorkspaceResponse,
  shouldUsePublicDemoFallback
} from "./demo.js";
import { PublicNotFoundError, createPublicBooking, getPublicSlots, getPublicWorkspaceData } from "./service.js";

export const publicRoutes: FastifyPluginAsync = async (app) => {
  app.get("/public/b/:slug", async (req) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    try {
      return await getPublicWorkspaceData(slug);
    } catch (error) {
      if (shouldUsePublicDemoFallback({ slug, error, enabled: env.PUBLIC_DEMO_ENABLED })) {
        return demoPublicWorkspaceResponse;
      }

      if (error instanceof PublicNotFoundError) {
        throw app.httpErrors.notFound(error.message);
      }

      throw error;
    }
  });

  app.get("/public/b/:slug/slots", async (req) => {
    const query = z
      .object({
        serviceId: z.string(),
        staffMemberId: z.string().optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
      })
      .parse(req.query);
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    try {
      return await getPublicSlots({ slug, ...query });
    } catch (error) {
      if (shouldUsePublicDemoFallback({ slug, error, enabled: env.PUBLIC_DEMO_ENABLED })) {
        return createDemoPublicSlotsResponse(query.date, query.serviceId, query.staffMemberId);
      }

      if (error instanceof PublicNotFoundError) {
        throw app.httpErrors.notFound(error.message);
      }

      throw error;
    }
  });

  app.post("/public/b/:slug/book", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req) => {
    const body = z
      .object({
        serviceId: z.string(),
        staffMemberId: z.string(),
        startAt: z.string(),
        name: z.string().min(2),
        whatsapp: z.string().min(8),
        email: z.string().email().optional(),
        whatsappOptIn: z.boolean(),
        policyAccepted: z.boolean(),
        notes: z.string().max(240).optional()
      })
      .parse(req.body);
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const idempotencyKey = req.headers["x-idempotency-key"];

    try {
      return await createPublicBooking({
        slug,
        ...body,
        ip: req.ip,
        idempotencyKey: typeof idempotencyKey === "string" ? idempotencyKey : undefined
      });
    } catch (error) {
      if (shouldUsePublicDemoFallback({ slug, error, enabled: env.PUBLIC_DEMO_ENABLED })) {
        const response = createDemoPublicBookingResponse({
          serviceId: body.serviceId,
          startAt: body.startAt
        });
        if (response) {
          return response;
        }
      }

      if (error instanceof PublicNotFoundError) {
        throw app.httpErrors.notFound(error.message);
      }

      throw app.httpErrors.conflict((error as Error).message);
    }
  });
};
