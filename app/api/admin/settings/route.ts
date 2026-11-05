import { prisma } from "@/lib/prisma";
import { hasSameOrigin } from "@/lib/request-security";
import { getCurrentProfile } from "@/lib/current-profile";
import { DEFAULT_CONFIG, validateConfig } from "@/lib/studio-domain";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

async function adminOnly() {
  const profile = await getCurrentProfile();
  if (!profile) return { error: Response.json({ error: "Connectez-vous pour continuer." }, { status: 401 }) };
  if (profile.role !== "ADMIN") return { error: Response.json({ error: "Accès administrateur requis." }, { status: 403 }) };
  return { profile };
}

export async function GET() {
  const access = await adminOnly();
  if ("error" in access) return access.error;
  try {
    const row = await prisma.studioSettings.findUnique({ where: { key: "config" } });
    return Response.json({ config: row ? validateConfig(row.value) : DEFAULT_CONFIG }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Les réglages du studio sont indisponibles." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const access = await adminOnly();
  if ("error" in access) return access.error;
  try {
    const origin = request.headers.get("origin");
    if (!hasSameOrigin(request)) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
    const body = await request.json() as { config?: unknown };
    const config = validateConfig(body.config);
    await prisma.studioSettings.upsert({
      where: { key: "config" },
      create: { key: "config", value: config as Prisma.InputJsonValue },
      update: { value: config as Prisma.InputJsonValue },
    });
    return Response.json({ ok: true, config });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Réglages invalides." }, { status: 400 });
  }
}
