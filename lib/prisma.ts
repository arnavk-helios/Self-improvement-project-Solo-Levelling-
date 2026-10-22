// One shared connection to the database.
// Every other file imports "prisma" from here instead of making its own.

import { PrismaClient } from "@prisma/client";

// While you develop, the app reloads itself often. This keeps one connection
// alive instead of opening a new one every reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}