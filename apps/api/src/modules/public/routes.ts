import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createPublicBooking, getPublicSlots, getPublicWorkspaceData } from "./service.js";

export const publicRoutes: FastifyPluginAsync = async (app) => {
  app.get("/public/b/:slug", async (req) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    return getPublicWorkspaceData(slug);
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
    return getPublicSlots({ slug, ...query });
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
      throw app.httpErrors.conflict((error as Error).message);
    }
  });
};
