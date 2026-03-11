import { randomUUID } from "node:crypto";
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

export const waitlistRoutes: FastifyPluginAsync = async (app) => {
  app.post("/public/waitlist/:slug", async (req) => {
    const body = z
      .object({
        serviceId: z.string(),
        staffMemberId: z.string().optional(),
        date: z.string(),
        name: z.string().min(2),
        whatsapp: z.string().min(8),
        email: z.string().email().optional()
      })
      .parse(req.body);
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { slug } });
    const service = await prisma.service.findFirst({
      where: {
        id: body.serviceId,
        workspaceId: workspace.id,
        active: true
      }
    });

    if (!service) {
      throw app.httpErrors.notFound("Servico nao encontrado neste workspace.");
    }

    let staffMemberId: string | null = null;
    if (body.staffMemberId) {
      const staffMember = await prisma.staffMember.findFirst({
        where: {
          id: body.staffMemberId,
          workspaceId: workspace.id,
          active: true,
          staffServices: {
            some: {
              serviceId: service.id
            }
          }
        }
      });

      if (!staffMember) {
        throw app.httpErrors.notFound("Profissional nao encontrado para este servico.");
      }

      staffMemberId = staffMember.id;
    }

    const client = await prisma.client.upsert({
      where: {
        workspaceId_whatsapp: {
          workspaceId: workspace.id,
          whatsapp: body.whatsapp
        }
      },
      update: {
        name: body.name,
        email: body.email
      },
      create: {
        workspaceId: workspace.id,
        name: body.name,
        whatsapp: body.whatsapp,
        email: body.email
      }
    });

    return prisma.waitlistEntry.create({
      data: {
        workspaceId: workspace.id,
        clientId: client.id,
        serviceId: service.id,
        staffMemberId,
        desiredDate: new Date(body.date),
        token: randomUUID(),
        tokenExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      }
    });
  });
};
