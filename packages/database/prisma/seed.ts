import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/belezafoco"
  })
});

async function main() {
  const passwordHash = await hash(process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!", 12);

  const ownerRole = await prisma.role.upsert({
    where: { code: "owner" },
    update: {},
    create: {
      code: "owner",
      name: "Owner",
      permissions: ["*"]
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: process.env.SEED_WORKSPACE_SLUG ?? "demo-beleza-foco" },
    update: {},
    create: {
      name: process.env.SEED_WORKSPACE_NAME ?? "Studio Beleza Foco",
      slug: process.env.SEED_WORKSPACE_SLUG ?? "demo-beleza-foco",
      timezone: "America/Sao_Paulo",
      businessProfile: {
        create: {
          niche: "Salao premium",
          legalName: "Studio Beleza Foco LTDA",
          tradeName: "Studio Beleza Foco",
          primaryColor: "#c26b36",
          accentColor: "#0f172a",
          bookingPolicy: "Sinal via Pix para horarios premium e tolerancia de 10 minutos."
        }
      },
      subscription: {
        create: {
          planCode: "growth",
          status: "active",
          seatsIncluded: 6
        }
      }
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "owner@belezafoco.dev" },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL ?? "owner@belezafoco.dev",
      fullName: "Juan Owner",
      status: "active",
      emailVerifiedAt: new Date(),
      passwordCredential: {
        create: {
          passwordHash
        }
      }
    }
  });

  await prisma.membership.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: owner.id
      }
    },
    update: {
      roleId: ownerRole.id
    },
    create: {
      workspaceId: workspace.id,
      userId: owner.id,
      roleId: ownerRole.id,
      status: "active",
      joinedAt: new Date()
    }
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
