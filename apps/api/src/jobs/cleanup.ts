import { addDays } from "date-fns";
import { pathToFileURL } from "node:url";
import { prisma } from "../lib/prisma.js";

export async function runCleanupJob(now = new Date()) {
  const expiredWaitlist = await prisma.waitlistEntry.updateMany({
    where: {
      tokenExpiresAt: { lt: now },
      active: true
    },
    data: { active: false }
  });

  const deletedRefreshTokens = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { revokedAt: { lt: addDays(now, -7) } }
      ]
    }
  });

  return {
    waitlistEntriesDeactivated: expiredWaitlist.count,
    refreshTokensDeleted: deletedRefreshTokens.count
  };
}

if (isDirectExecution()) {
  await runCleanupJob();
  await prisma.$disconnect();
}

function isDirectExecution() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}
