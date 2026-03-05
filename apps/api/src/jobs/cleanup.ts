import { prisma } from "../lib/prisma.js";

await prisma.waitlistEntry.updateMany({ where: { tokenExpiresAt: { lt: new Date() }, active: true }, data: { active: false } });
