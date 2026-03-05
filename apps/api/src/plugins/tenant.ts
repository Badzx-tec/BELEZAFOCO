import fp from "fastify-plugin";
import { prisma } from "../lib/prisma.js";

export default fp(async (app) => {
  app.decorateRequest("workspaceId", "");
  app.addHook("preHandler", async (req, reply) => {
    if (!req.url.startsWith("/admin") && !req.url.startsWith("/public") && !req.url.startsWith("/auth") && !req.url.startsWith("/health")) {
      if (!req.headers.authorization) return;
      await app.auth(req as any);
      const userId = (req.user as any).sub;
      const headerWorkspaceId = req.headers["x-workspace-id"] as string | undefined;
      if (!headerWorkspaceId) {
        reply.code(400).send({ message: "x-workspace-id header obrigatório" });
        return;
      }
      const membership = await prisma.membership.findUnique({ where: { userId_workspaceId: { userId, workspaceId: headerWorkspaceId } } });
      if (!membership) {
        reply.code(403).send({ message: "Acesso negado" });
        return;
      }
      req.workspaceId = headerWorkspaceId;
    }
  });
});

declare module "fastify" {
  interface FastifyRequest {
    workspaceId: string;
  }
}
