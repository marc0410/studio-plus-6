import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { DEFAULT_CONFIG } from "../lib/studio-domain.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL doit pointer vers le projet Supabase de développement.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  for (const [sortOrder, service] of DEFAULT_CONFIG.services.entries()) {
    await prisma.service.upsert({
      where: { id: service.id },
      create: {
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price,
        image: service.image,
        sortOrder,
      },
      update: {
        name: service.name,
        duration: service.duration,
        price: service.price,
        image: service.image,
        sortOrder,
      },
    });
  }

  await prisma.studioSettings.upsert({
    where: { key: "config" },
    create: { key: "config", value: DEFAULT_CONFIG },
    update: {},
  });
  console.info("Catalogue Studio+ initialisé dans la base configurée.");
} finally {
  await prisma.$disconnect();
}
