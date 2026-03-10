import "./instrument.js";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { flushSentry } from "./instrument.js";

const app = buildApp();

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`API rodando na porta ${env.PORT}`);
} catch (error) {
  app.log.error(error);
  await flushSentry();
  process.exit(1);
}
