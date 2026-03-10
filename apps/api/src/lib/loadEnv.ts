import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotenv } from "dotenv";

let loaded = false;

export function loadWorkspaceEnv() {
  if (loaded) return;

  const candidates = [
    process.env.BELEZAFOCO_ENV_PATH,
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(process.cwd(), "../../../.env")
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    loadDotenv({ path: candidate, override: false });
    loaded = true;
    return;
  }
}

loadWorkspaceEnv();
