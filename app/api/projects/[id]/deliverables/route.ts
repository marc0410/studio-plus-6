import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { createSupabaseAdminClient, STUDIO_DELIVERABLES_BUCKET } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const maxSize = 25 * 1024 * 1024;
const types = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === (process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin); }
  catch { return false; }
}

async function authorizedProject(id: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: json({ error: "Connectez-vous pour continuer." }, 401) };
  if (!["ADMIN", "MANAGER", "STAFF"].includes(profile.role)) return { error: json({ error: "Seule l’équipe peut partager un livrable." }, 403) };
  const project = await prisma.studioProject.findFirst({
    where: { id, booking: ["ADMIN", "MANAGER"].includes(profile.role) ? {} : { assignments: { some: { staffId: profile.id } } } },
    select: { id: true },
  });
  return project ? { project } : { error: json({ error: "Projet introuvable ou non affecté à votre compte." }, 404) };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  const { id } = await params;
  const access = await authorizedProject(id);
  if (access.error) return access.error;
  let input: { name?: unknown; contentType?: unknown; size?: unknown };
  try { input = await request.json() as typeof input; } catch { return json({ error: "Fichier invalide." }, 400); }
  if (typeof input.name !== "string" || input.name.length < 1 || input.name.length > 180 || typeof input.contentType !== "string" || !types.has(input.contentType) || !Number.isSafeInteger(input.size) || Number(input.size) < 1 || Number(input.size) > maxSize) return json({ error: "Choisissez un PDF, JPG, PNG ou WEBP de 25 Mo maximum." }, 400);
  const cleanName = input.name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(-100) || "livrable";
  const objectPath = `${id}/${randomUUID()}-${cleanName}`;
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(STUDIO_DELIVERABLES_BUCKET).createSignedUploadUrl(objectPath);
    if (error || !data) throw error ?? new Error("Autorisation indisponible.");
    return json({ path: objectPath, token: data.token, bucket: STUDIO_DELIVERABLES_BUCKET }, 201);
  } catch (error) {
    console.error("Private deliverable signing failed", error);
    return json({ error: "Le stockage privé est indisponible. Vérifiez le bucket Supabase." }, 503);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  const { id } = await params;
  const access = await authorizedProject(id);
  if (access.error) return access.error;
  let input: { path?: unknown; name?: unknown; contentType?: unknown; size?: unknown };
  try { input = await request.json() as typeof input; } catch { return json({ error: "Fichier invalide." }, 400); }
  if (typeof input.path !== "string" || !input.path.startsWith(`${id}/`) || typeof input.name !== "string" || input.name.length < 1 || input.name.length > 180 || typeof input.contentType !== "string" || !types.has(input.contentType) || !Number.isSafeInteger(input.size) || Number(input.size) < 1 || Number(input.size) > maxSize) return json({ error: "Métadonnées du fichier invalides." }, 400);
  try {
    const supabase = createSupabaseAdminClient();
    const { data: info, error } = await supabase.storage.from(STUDIO_DELIVERABLES_BUCKET).info(input.path);
    if (error || !info || info.size !== input.size || info.contentType !== input.contentType) return json({ error: "Le fichier téléversé ne correspond pas aux informations annoncées." }, 409);
    const deliverable = await prisma.projectDeliverable.create({ data: { projectId: id, name: input.name, objectPath: input.path, contentType: input.contentType, sizeBytes: Number(input.size), visibleAt: new Date() } });
    return json({ ok: true, deliverable }, 201);
  } catch (error) {
    console.error("Deliverable finalization failed", error);
    return json({ error: "Le fichier n’a pas pu être ajouté au projet." }, 503);
  }
}
