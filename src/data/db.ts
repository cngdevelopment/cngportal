/**
 * Prisma singleton. ONLY files inside src/data/ may import this.
 * (Spec §5.3 - all data access goes through this layer. An ESLint
 * rule enforcing the boundary gets added with the lint setup.)
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
