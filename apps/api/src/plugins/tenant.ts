import fp from "fastify-plugin";
import { prisma } from "../lib/prisma.js";

export default fp(async (app) => {
  app.decorateRequest("workspaceId", "");
  app.decorateRequest("membershipRole", "");

  app.addHook("preHandler", async (req, reply) => {
    const isWorkspaceRoute = req.url === "/me" || req.url.startsWith("/me/");
    const isAdminRoute = req.url === "/admin" || req.url.startsWith("/admin/");

    // The combined Northflank service also serves the SPA and static assets.
    // Only API namespaces that carry tenant data should require auth here.
    if (!isWorkspaceRoute && !isAdminRoute) return;

    if (!req.headers.authorization) {
      reply.code(401).send({ message: "Autenticacao obrigatoria" });
      return;
    }

    await app.authenticate(req as any);

    if (isAdminRoute) return;

    const userId = (req.user as any).sub;
    const headerWorkspaceId = req.headers["x-workspace-id"] as string | undefined;

    if (!headerWorkspaceId) {
      reply.code(400).send({ message: "x-workspace-id header obrigatorio" });
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
