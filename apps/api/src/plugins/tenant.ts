import fp from "fastify-plugin";
import { prisma } from "../lib/prisma.js";
import type { AppRole } from "../lib/types.js";

const publicPrefixes = ["/auth", "/public", "/payments/webhook", "/health", "/ready"];

export default fp(async (app) => {
  app.decorateRequest("workspaceId", "");
  app.decorateRequest("membershipRole", "staff");
  app.decorateRequest("userId", "");

  app.addHook("preHandler", async (req, reply) => {
    if (publicPrefixes.some((prefix) => req.url.startsWith(prefix))) {
      return;
    }

    await app.authenticate(req as never);

    const workspaceId = (req.headers["x-workspace-id"] as string | undefined) ?? (req.user as any).workspaceId;
    if (!workspaceId) {
      reply.code(400).send({ message: "Header x-workspace-id obrigatorio." });
      return;
    }

    const userId = (req.user as any).sub as string;
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      }
    });

    if (!membership) {
      reply.code(403).send({ message: "Acesso negado ao workspace informado." });
      return;
    }

    req.userId = userId;
    req.workspaceId = workspaceId;
    req.membershipRole = membership.role as AppRole;
  });
});

declare module "fastify" {
  interface FastifyRequest {
    workspaceId: string;
    membershipRole: AppRole;
    userId: string;
  }
}
