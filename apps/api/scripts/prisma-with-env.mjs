import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { config as loadDotenv } from "dotenv";

const require = createRequire(import.meta.url);
const prismaCliPath = require.resolve("prisma/build/index.js");
const candidates = [
  process.env.BELEZAFOCO_ENV_PATH,
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), "../../../.env")
].filter(Boolean);

for (const candidate of candidates) {
  if (!existsSync(candidate)) continue;
  loadDotenv({ path: candidate, override: false });
  break;
}

const child = spawn(process.execPath, [prismaCliPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
