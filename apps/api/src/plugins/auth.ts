import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { env } from "../config/env.js";

export default fp(async (app) => {
  await app.register(jwt, { secret: env.JWT_ACCESS_SECRET, namespace: "access" });
  await app.register(jwt, { secret: env.JWT_REFRESH_SECRET, namespace: "refresh" });

  app.decorate("auth", async (request: any) => {
    await request.accessJwtVerify();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    auth: (request: any) => Promise<void>;
  }
}
