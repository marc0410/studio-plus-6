import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

if (process.env.SEED_DEMO_USERS !== "true" || process.env.SEED_ENV !== "dev") {
  throw new Error("Seed interrompu : définissez SEED_DEMO_USERS=true et SEED_ENV=dev. Les comptes de démonstration sont interdits en production.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;
const password = process.env.SEED_DEFAULT_PASSWORD;
if (!url || !serviceKey || !databaseUrl || !password || password.length < 12) {
  throw new Error("Configurez NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL et SEED_DEFAULT_PASSWORD (12 caractères minimum).");
}

const suffix = process.env.SEED_EMAIL_SUFFIX || "@studio-plus-dev.test";
const users = [
  ["client", "Client Démo", "CLIENT"],
  ["staff", "Staff Démo", "STAFF"],
  ["manager", "Manager Démo", "MANAGER"],
  ["admin", "Admin Démo", "ADMIN"],
] as const;

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  for (const [local, fullName, role] of users) {
    const email = `${local}${suffix}`.toLowerCase();
    const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    const existing = listed.users.find(user => user.email?.toLowerCase() === email);
    let user = existing;
    let createError: Error | null = null;
    if (!user) {
      const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
      user = created.data.user ?? undefined;
      createError = created.error;
    }
    if (createError || !user) throw createError ?? new Error(`Impossible de créer ${email}`);
    await prisma.profile.upsert({
      where: { id: user.id },
      create: { id: user.id, email, fullName, role },
      update: { email, fullName, role, isActive: true },
    });
    console.info(`Compte dev prêt : ${email} → ${role}`);
  }
} finally {
  await prisma.$disconnect();
}
