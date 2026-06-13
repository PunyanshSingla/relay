import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const isProduction = process.env.NODE_ENV === "production";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const pool = globalForPrisma.pgPool || new Pool({ connectionString: process.env.DATABASE_URL });
if (!isProduction) globalForPrisma.pgPool = pool;

const adapter = new PrismaPg(pool);

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
if (!isProduction) globalForPrisma.prisma = prisma;

export { prisma, pool };
