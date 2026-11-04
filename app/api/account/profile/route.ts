import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
function sameOrigin(request: Request) { const origin = request.headers.get("origin"); try { return !!origin && new URL(origin).origin === new URL(request.url).origin; } catch { return false; } }

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  return json({ profile: { fullName: profile.fullName, phone: profile.phone, email: profile.email } });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  try {
    const body = await request.json() as { fullName?: unknown; phone?: unknown };
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (fullName.length < 2 || fullName.length > 100) return json({ error: "Le nom doit contenir entre 2 et 100 caractères." }, 400);
    if (phone && !/^\+?[\d\s().-]{6,25}$/.test(phone)) return json({ error: "Le numéro de téléphone est invalide." }, 400);
    const updated = await prisma.profile.update({ where: { id: profile.id }, data: { fullName, phone: phone || null }, select: { fullName: true, phone: true, email: true } });
    return json({ ok: true, profile: updated });
  } catch { return json({ error: "Le profil n’a pas pu être modifié." }, 503); }
}
