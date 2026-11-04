import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  studioPrisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL est manquante. Configurez la base Supabase de cet environnement.");
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

function getPrismaClient() {
  if (!globalForPrisma.studioPrisma) {
    globalForPrisma.studioPrisma = createPrismaClient();
  }
  return globalForPrisma.studioPrisma;
}

// Delay reading DATABASE_URL until a request actually uses the database. This
// lets Next.js collect API route metadata during builds without DB credentials.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
