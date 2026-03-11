import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp();

async function start() {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`API rodando na porta ${env.PORT}`);
  } catch (error) {
    app.log.error(error, "Falha ao iniciar a API");
    process.exit(1);
  }
}

void start();
