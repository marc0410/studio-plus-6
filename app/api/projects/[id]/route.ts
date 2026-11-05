import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { hasSameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function accessibleProject(id: string, profile: NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>) {
  const privileged = ["ADMIN", "MANAGER"].includes(profile.role);
  return prisma.studioProject.findFirst({
    where: { id, booking: privileged ? {} : profile.role === "STAFF" ? { assignments: { some: { staffId: profile.id } } } : { ownerId: profile.id } },
    include: {
      booking: { select: { ownerId: true, title: true, date: true, time: true, status: true, name: true, email: true } },
      tasks: { orderBy: { sortOrder: "asc" } },
      notes: { where: privileged || profile.role === "STAFF" ? {} : { internal: false }, orderBy: { createdAt: "asc" } },
      deliverables: { where: { visibleAt: { not: null } }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  const { id } = await params;
  const project = await accessibleProject(id, profile);
  return project ? json({ project }) : json({ error: "Projet introuvable ou accès non autorisé." }, 404);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  if (!["ADMIN", "MANAGER", "STAFF"].includes(profile.role)) return json({ error: "Accès équipe requis." }, 403);
  const { id } = await params;
  const project = await accessibleProject(id, profile);
  if (!project) return json({ error: "Projet introuvable ou non affecté à votre compte." }, 404);
  let input: { kind?: unknown; title?: unknown; content?: unknown; internal?: unknown };
  try { input = await request.json() as typeof input; } catch { return json({ error: "Données invalides." }, 400); }
  if (input.kind === "task") {
    if (typeof input.title !== "string" || input.title.trim().length < 2 || input.title.length > 140) return json({ error: "Le titre de la tâche doit contenir entre 2 et 140 caractères." }, 400);
    const task = await prisma.projectTask.create({ data: { projectId: id, title: input.title.trim(), description: typeof input.content === "string" ? input.content.trim().slice(0, 2000) : "", sortOrder: project.tasks.length + 1 } });
    return json({ task }, 201);
  }
  if (input.kind === "note") {
    if (typeof input.content !== "string" || input.content.trim().length < 1 || input.content.length > 3000) return json({ error: "La note doit contenir entre 1 et 3 000 caractères." }, 400);
    const note = await prisma.projectNote.create({ data: { projectId: id, authorId: profile.id, content: input.content.trim(), internal: input.internal !== false } });
    return json({ note }, 201);
  }
  return json({ error: "Type d’action inconnu." }, 400);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  const { id } = await params;
  const project = await accessibleProject(id, profile);
  if (!project || !["ADMIN", "MANAGER", "STAFF"].includes(profile.role)) return json({ error: "Projet introuvable ou accès non autorisé." }, 404);
  let input: { taskId?: unknown; status?: unknown };
  try { input = await request.json() as typeof input; } catch { return json({ error: "Données invalides." }, 400); }
  if (typeof input.taskId !== "string" || !["TODO", "IN_PROGRESS", "DONE"].includes(String(input.status))) return json({ error: "État de tâche invalide." }, 400);
  const result = await prisma.projectTask.updateMany({ where: { id: input.taskId, projectId: id }, data: { status: input.status as string } });
  return result.count ? json({ ok: true }) : json({ error: "Tâche introuvable." }, 404);
}
