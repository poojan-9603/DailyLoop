import { PrismaClient } from "@prisma/client";

import { env } from "@/env";

// Singleton Prisma client — avoids exhausting connections during HMR in dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
