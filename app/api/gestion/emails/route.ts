import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { retryFailedStudioEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function canManage() {
  const profile = await getCurrentProfile();
  return profile && ["ADMIN", "MANAGER"].includes(profile.role) ? profile : null;
}

export async function GET(request: Request) {
  const profile = await canManage();
  if (!profile) return Response.json({ error: "Accès réservé à l’équipe de gestion." }, { status: 403 });
  try {
    const params = new URL(request.url).searchParams;
    const pageRaw = Number(params.get("page"));
    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const statusParam = params.get("status") ?? "all";
    const status = ["QUEUED", "SENT", "FAILED"].includes(statusParam) ? statusParam : undefined;
    const q = params.get("q")?.trim();
    const where = { ...(status ? { status } : {}), ...(q ? { OR: [{ recipient: { contains: q, mode: "insensitive" as const } }, { event: { contains: q, mode: "insensitive" as const } }] } : {}) };
    const [total, deliveries] = await Promise.all([prisma.emailDelivery.count({ where }), prisma.emailDelivery.findMany({
      where,
      select: { id: true, event: true, recipient: true, providerId: true, status: true, error: true, attempts: true, createdAt: true, sentAt: true, retryPayload: true },
      orderBy: { createdAt: "desc" },
      take: 50, skip: (page - 1) * 50,
    })]);
    return Response.json({ deliveries: deliveries.map(({ retryPayload, ...delivery }) => ({
      ...delivery,
      canRetry: Boolean(retryPayload) && delivery.attempts < 3,
    })), pagination: { page, pageSize: 50, total, pages: Math.max(1, Math.ceil(total / 50)) } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load email deliveries", error);
    return Response.json({ error: "Le journal des e-mails est indisponible." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const profile = await canManage();
  if (!profile) return Response.json({ error: "Accès réservé à l’équipe de gestion." }, { status: 403 });
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  } catch {
    return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  }
  try {
    const body = await request.json() as { id?: unknown };
    if (typeof body.id !== "string" || body.id.length > 64) return Response.json({ error: "Identifiant d’e-mail invalide." }, { status: 400 });
    const result = await retryFailedStudioEmail(body.id);
    if (!result.ok) return Response.json({ error: result.error }, { status: 409 });
    return Response.json({ ok: true, message: "E-mail renvoyé." });
  } catch (error) {
    console.error("Email retry failed", error);
    return Response.json({ error: "Impossible de relancer cet e-mail." }, { status: 503 });
  }
}
