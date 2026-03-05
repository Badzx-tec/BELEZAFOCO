import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";

export const workspaceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/workspace", async (req) => prisma.workspace.findUnique({ where: { id: req.workspaceId } }));

  app.put("/me/workspace", async (req) => {
    const body = z.object({ name: z.string(), address: z.string().optional(), timezone: z.string(), minAdvanceMinutes: z.number().int(), maxAdvanceDays: z.number().int(), freeCancelHours: z.number().int(), lateCancelFeePercent: z.number().int(), noShowFeePercent: z.number().int() }).parse(req.body);
    return prisma.workspace.update({ where: { id: req.workspaceId }, data: body });
  });

  app.post("/me/business-hours", async (req) => {
    const body = z.array(z.object({ weekday: z.number().min(0).max(6), startTime: z.string(), endTime: z.string() })).parse(req.body);
    await prisma.businessHour.deleteMany({ where: { workspaceId: req.workspaceId } });
    return prisma.businessHour.createMany({ data: body.map((b) => ({ ...b, workspaceId: req.workspaceId })) });
  });

  app.post("/me/templates", async (req) => {
    const body = z.object({ type: z.string(), templateName: z.string(), language: z.string().default("pt_BR"), body: z.string() }).parse(req.body);
    return prisma.messageTemplate.upsert({
      where: { workspaceId_type: { workspaceId: req.workspaceId, type: body.type } },
      update: body,
      create: { ...body, workspaceId: req.workspaceId }
    });
  });
};
