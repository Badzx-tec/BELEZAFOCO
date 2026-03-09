import fp from "fastify-plugin";
import { prisma } from "../lib/prisma.js";

export default fp(async (app) => {
  app.decorateRequest("workspaceId", "");
  app.decorateRequest("membershipRole", "");

  app.addHook("preHandler", async (req, reply) => {
    const isPublicRoute =
      req.url.startsWith("/public") ||
      req.url.startsWith("/auth") ||
      req.url.startsWith("/health") ||
      req.url.startsWith("/ready");

    if (isPublicRoute) return;

    if (!req.headers.authorization) {
      reply.code(401).send({ message: "Autenticação obrigatória" });
      return;
    }

    await app.auth(req as any);

    if (req.url.startsWith("/admin")) return;

    const userId = (req.user as any).sub;
    const headerWorkspaceId = req.headers["x-workspace-id"] as string | undefined;

    if (!headerWorkspaceId) {
      reply.code(400).send({ message: "x-workspace-id header obrigatório" });
      return;
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: headerWorkspaceId } }
    });

    if (!membership) {
      reply.code(403).send({ message: "Acesso negado" });
      return;
    }

    req.workspaceId = headerWorkspaceId;
    req.membershipRole = membership.role;
  });
});

declare module "fastify" {
  interface FastifyRequest {
    workspaceId: string;
    membershipRole: string;
  }
}
