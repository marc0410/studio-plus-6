import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const validToken = (value: string | null) => !!value && value.length <= 512 && /^[A-Za-z0-9_-]+$/.test(value);

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token_hash");
  if (!validToken(token)) return json({ error: "Lien d’invitation invalide." }, 400);
  const invitation = await prisma.teamInvitation.findUnique({ where: { tokenDigest: digest(token!) }, select: { role: true, expiresAt: true, status: true } });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date()) return json({ error: "Cette invitation est expirée, révoquée ou déjà utilisée." }, 410);
  return json({ ok: true, role: invitation.role });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try { if (!origin || new URL(origin).origin !== new URL(request.url).origin) return json({ error: "Origine non autorisée." }, 403); } catch { return json({ error: "Origine non autorisée." }, 403); }
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "La session d’invitation n’a pas été créée." }, 401);
  const invitation = await prisma.teamInvitation.findUnique({ where: { userId: profile.id } });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date()) return json({ error: "Cette invitation n’est plus valide." }, 410);
  await prisma.teamInvitation.update({ where: { userId: profile.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
  return json({ ok: true, role: invitation.role });
}
