import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import "../src/lib/loadEnv.js";
import { buildSubscriptionSeed } from "../src/lib/plan.js";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@belezafoco.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "12345678";
  const hash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash },
    create: { email, passwordHash: hash, name: "Admin" }
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-beleza" },
    update: {},
    create: { name: "Demo Beleza", slug: "demo-beleza" }
  });

  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: { role: "owner" },
    create: { userId: user.id, workspaceId: workspace.id, role: "owner" }
  });

  await prisma.workspaceSubscription.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: { workspaceId: workspace.id, ...buildSubscriptionSeed("trial") }
  });
}

main().finally(() => prisma.$disconnect());
