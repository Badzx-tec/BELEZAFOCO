import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { randomUUID } from "crypto";

export const waitlistRoutes: FastifyPluginAsync = async (app) => {
  app.post("/public/waitlist/:slug", async (req) => {
    const body = z.object({ serviceId: z.string(), staffMemberId: z.string().optional(), date: z.string(), name: z.string(), whatsapp: z.string(), email: z.string().optional() }).parse(req.body);
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const ws = await prisma.workspace.findUniqueOrThrow({ where: { slug } });
    const client = await prisma.client.upsert({ where: { workspaceId_whatsapp: { workspaceId: ws.id, whatsapp: body.whatsapp } }, update: { name: body.name, email: body.email }, create: { workspaceId: ws.id, name: body.name, whatsapp: body.whatsapp, email: body.email } });
    return prisma.waitlistEntry.create({ data: { workspaceId: ws.id, clientId: client.id, serviceId: body.serviceId, staffMemberId: body.staffMemberId, desiredDate: new Date(body.date), token: randomUUID(), tokenExpiresAt: new Date(Date.now() + 2 * 3600000) } });
  });
};
