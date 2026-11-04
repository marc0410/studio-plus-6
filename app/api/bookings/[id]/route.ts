import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { safelySendStudioEmail } from "@/lib/email";

export const runtime = "nodejs";
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  const { id } = await params;
  const manager = ["ADMIN", "MANAGER"].includes(profile.role);
  const booking = await prisma.booking.findFirst({
    where: { id, ...(manager ? {} : profile.role === "STAFF" ? { assignments: { some: { staffId: profile.id } } } : { ownerId: profile.id }) },
    include: { service: true, participants: true, payments: { orderBy: { paidAt: "desc" } }, scheduleChanges: { orderBy: { createdAt: "desc" } }, project: { include: { tasks: { orderBy: { sortOrder: "asc" } }, deliverables: { where: { visibleAt: { not: null } } } } } },
  });
  if (!booking) return json({ error: "Séance introuvable ou accès non autorisé." }, 404);
  return json({ booking });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== (process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin)) return json({ error: "Origine non autorisée." }, 403);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  const { id } = await params;
  let input: { status?: unknown; amount?: unknown };
  try { input = await request.json() as typeof input; } catch { return json({ error: "Données invalides." }, 400); }
  const manager = ["ADMIN", "MANAGER"].includes(profile.role);
  const booking = await prisma.booking.findFirst({ where: { id, ...(manager ? {} : profile.role === "STAFF" ? { assignments: { some: { staffId: profile.id } } } : { ownerId: profile.id }) } });
  if (!booking) return json({ error: "Séance introuvable ou accès non autorisé." }, 404);
  if (booking.status === "REQUESTED" && booking.expiresAt && booking.expiresAt <= new Date()) {
    const expired = await prisma.$transaction(async tx => {
      const changed = await tx.booking.updateMany({ where: { id, status: "REQUESTED", expiresAt: { lte: new Date() } }, data: { status: "CANCELLED" } });
      if (changed.count) await tx.bookingSlot.deleteMany({ where: { bookingId: id } });
      return changed.count > 0;
    });
    return json({ error: expired ? "Cette demande a expiré et son créneau a été libéré. Le client peut envoyer une nouvelle demande." : "Cette demande vient d’expirer ou d’être traitée. Actualisez la page." }, 409);
  }
  const status = typeof input.status === "string" ? input.status.toUpperCase() : "";

  if (status === "CONFIRMED") {
    if (!manager) return json({ error: "Seul le studio peut confirmer la séance." }, 403);
    if (booking.status !== "REQUESTED" || !Number.isSafeInteger(input.amount) || Number(input.amount) < 0 || Number(input.amount) > 100000000) return json({ error: "Renseignez un montant valide pour confirmer la demande." }, 409);
    const confirmed = await prisma.$transaction(async tx => {
      const changed = await tx.booking.updateMany({ where: { id, status: "REQUESTED" }, data: { status: "CONFIRMED", amount: Number(input.amount) } });
      if (!changed.count) return false;
      const project = await tx.studioProject.upsert({ where: { bookingId: id }, create: { bookingId: id, title: booking.title }, update: {} });
      if (await tx.projectTask.count({ where: { projectId: project.id } }) === 0) await tx.projectTask.createMany({ data: [{ projectId: project.id, title: "Préparation de la séance", sortOrder: 1 }, { projectId: project.id, title: "Réalisation", sortOrder: 2 }, { projectId: project.id, title: "Post-production et livrables", sortOrder: 3 }] });
      return true;
    });
    if (!confirmed) return json({ error: "Cette demande a déjà été traitée." }, 409);
    await safelySendStudioEmail({ to: booking.email, subject: "Votre séance Studio+ est confirmée", title: "Votre séance est confirmée.", body: `${booking.title} · ${booking.date} à ${booking.time}. Montant convenu : ${new Intl.NumberFormat("fr-FR").format(Number(input.amount))} FCFA. Le paiement se fera sur place.`, actionLabel: "Voir ma réservation", actionUrl: `${process.env.APP_URL ?? new URL(request.url).origin}/espace`, event: "BOOKING_CONFIRMED" });
    return json({ ok: true, message: "La séance est confirmée." });
  }

  if (status === "CANCELLED") {
    if (booking.status === "CANCELLED" || booking.status === "COMPLETED" || booking.status === "NO_SHOW") return json({ error: "Cette séance ne peut plus être annulée." }, 409);
    if (!manager && profile.role !== "CLIENT") return json({ error: "Action non autorisée." }, 403);
    if (!manager && await prisma.bookingPayment.count({ where: { bookingId: id } }) > 0) return json({ error: "Un paiement a été enregistré. Contactez le studio pour annuler." }, 409);
    const cancelled = await prisma.$transaction(async tx => {
      const changed = await tx.booking.updateMany({ where: { id, status: booking.status }, data: { status: "CANCELLED" } });
      if (!changed.count) return false;
      await tx.bookingSlot.deleteMany({ where: { bookingId: id } });
      return true;
    });
    if (!cancelled) return json({ error: "Cette séance a été modifiée entre-temps. Actualisez la page." }, 409);
    await safelySendStudioEmail({ to: booking.email, subject: "Mise à jour de votre séance Studio+", title: "Votre séance a été annulée.", body: `${booking.title} · ${booking.date} à ${booking.time}. Contactez le studio si vous souhaitez choisir un autre créneau.`, actionLabel: "Faire une nouvelle demande", actionUrl: `${process.env.APP_URL ?? new URL(request.url).origin}/reserver`, event: "BOOKING_CANCELLED" });
    return json({ ok: true, message: "La séance est annulée." });
  }

  const team = ["ADMIN", "MANAGER", "STAFF"].includes(profile.role);
  if (!team) return json({ error: "Accès studio requis." }, 403);
  const allowed: Record<string, string[]> = { CONFIRMED: ["IN_PROGRESS", "NO_SHOW"], IN_PROGRESS: ["COMPLETED"] };
  if (!allowed[booking.status]?.includes(status)) return json({ error: "Cette transition de statut n’est pas autorisée." }, 409);
  const changed = await prisma.booking.updateMany({ where: { id, status: booking.status }, data: { status: status as "IN_PROGRESS" | "COMPLETED" | "NO_SHOW" } });
  if (!changed.count) return json({ error: "Cette séance a été modifiée entre-temps. Actualisez la page." }, 409);
  const updated = await prisma.booking.findUnique({ where: { id } });
  return json({ ok: true, booking: updated });
}
