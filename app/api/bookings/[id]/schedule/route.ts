import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { DEFAULT_CONFIG, slotTimes, validDate, validateBooking, validateConfig } from "@/lib/studio-domain";
import { safelySendStudioEmail } from "@/lib/email";
import { spaceOrigin } from "@/lib/hosts";

export const runtime = "nodejs";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === (new URL(request.url).origin); }
  catch { return false; }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  const { id } = await params;
  const isStudio = ["ADMIN", "MANAGER"].includes(profile.role);
  const booking = await prisma.booking.findFirst({
    where: { id, ...(isStudio ? {} : profile.role === "STAFF" ? { assignments: { some: { staffId: profile.id } } } : { ownerId: profile.id }) },
    select: { id: true },
  });
  if (!booking) return json({ error: "Séance introuvable ou accès non autorisé." }, 404);
  const changes = await prisma.bookingScheduleChange.findMany({ where: { bookingId: id }, orderBy: { createdAt: "desc" } });
  return json({ changes });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  let input: Record<string, unknown>;
  try { input = await request.json() as Record<string, unknown>; }
  catch { return json({ error: "Données invalides." }, 400); }

  const { id } = await params;
  const isStudio = ["ADMIN", "MANAGER"].includes(profile.role);
  const booking = await prisma.booking.findUnique({ where: { id }, include: { service: true } });
  if (!booking || (!isStudio && booking.ownerId !== profile.id)) return json({ error: "Séance introuvable ou accès non autorisé." }, 404);

  if (input.decision === "approve" || input.decision === "reject") {
    if (!isStudio) return json({ error: "Seul le studio peut traiter cette proposition." }, 403);
    if (typeof input.changeId !== "string") return json({ error: "Proposition introuvable." }, 400);
    const change = await prisma.bookingScheduleChange.findFirst({ where: { id: input.changeId, bookingId: id, status: "PENDING" } });
    if (!change) return json({ error: "Cette proposition a déjà été traitée ou n’existe plus." }, 409);
    if (input.decision === "approve") {
      const settings = await prisma.studioSettings.findUnique({ where: { key: "config" } });
      const config = settings ? validateConfig(settings.value) : DEFAULT_CONFIG;
      try {
        const scheduleConfig = { ...config, services: config.services.map(service => service.id === booking.serviceId ? { ...service, duration: booking.duration } : service) };
        validateBooking({ service: booking.serviceId, date: change.newDate, time: change.newTime, title: booking.title, name: booking.name, email: booking.email, phone: booking.phone }, scheduleConfig);
      } catch (error) { return json({ error: error instanceof Error ? error.message : "Le créneau proposé n’est plus valide." }, 409); }
    }
    try {
      await prisma.$transaction(async tx => {
        const claimed = await tx.bookingScheduleChange.updateMany({ where: { id: change.id, bookingId: id, status: "PENDING" }, data: { status: input.decision === "approve" ? "APPROVED" : "REJECTED", decidedBy: profile.id, decidedAt: new Date() } });
        if (!claimed.count) throw new Error("Cette proposition a déjà été traitée.");
        if (input.decision === "approve") {
          const current = await tx.booking.findUnique({ where: { id }, select: { status: true, date: true, time: true } });
          if (!current || current.status !== "CONFIRMED" || current.date !== change.oldDate || current.time !== change.oldTime) throw new Error("Seule une séance confirmée au créneau d’origine peut être déplacée.");
          await tx.bookingSlot.deleteMany({ where: { bookingId: id } });
          await tx.bookingSlot.createMany({ data: slotTimes(change.newTime, booking.duration).map(time => ({ bookingId: id, date: change.newDate, time })) });
          await tx.booking.update({ where: { id }, data: { date: change.newDate, time: change.newTime } });
        }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return json({ error: "Le créneau proposé n’est plus disponible. Demandez-en un autre." }, 409);
      if (error instanceof Error && (error.message.includes("confirmée") || error.message.includes("déjà été traitée"))) return json({ error: error.message }, 409);
      throw error;
    }
    await safelySendStudioEmail({ to: booking.email, subject: input.decision === "approve" ? "Votre séance a été déplacée" : "Mise à jour de votre demande de changement", title: input.decision === "approve" ? "Nouveau créneau confirmé." : "Votre proposition de créneau n’a pas été retenue.", body: input.decision === "approve" ? `${booking.title} · ${change.newDate} à ${change.newTime}.` : `La séance reste prévue le ${booking.date} à ${booking.time}.`, actionLabel: "Voir ma réservation", actionUrl: `${spaceOrigin("app")}/`, event: `BOOKING_RESCHEDULE_${String(input.decision).toUpperCase()}` });
    return json({ ok: true, message: input.decision === "approve" ? "Le nouveau créneau est confirmé." : "La proposition a été refusée." });
  }

  if (!isStudio && profile.role !== "CLIENT") return json({ error: "Rôle non autorisé." }, 403);
  if (booking.status !== "CONFIRMED") return json({ error: "Seule une séance confirmée peut être replanifiée." }, 409);
  if (!validDate(input.date) || typeof input.time !== "string") return json({ error: "Choisissez une date et une heure valides." }, 400);
  const settings = await prisma.studioSettings.findUnique({ where: { key: "config" } });
  const config = settings ? validateConfig(settings.value) : DEFAULT_CONFIG;
  try {
    const scheduleConfig = { ...config, services: config.services.map(service => service.id === booking.serviceId ? { ...service, duration: booking.duration } : service) };
    validateBooking({ service: booking.serviceId, date: input.date, time: input.time, title: booking.title, name: booking.name, email: booking.email, phone: booking.phone }, scheduleConfig);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Créneau invalide." }, 400); }
  const pending = await prisma.bookingScheduleChange.findFirst({ where: { bookingId: id, status: "PENDING" } });
  if (pending) return json({ error: "Une proposition de changement est déjà en attente." }, 409);
  if (input.date === booking.date && input.time === booking.time) return json({ error: "Choisissez un créneau différent." }, 400);
  try {
    const change = await prisma.bookingScheduleChange.create({ data: { bookingId: id, requestedBy: profile.id, oldDate: booking.date, oldTime: booking.time, newDate: input.date, newTime: input.time } });
    return json({ ok: true, change, message: "Votre proposition a été envoyée au studio. Le créneau actuel reste confirmé en attendant sa réponse." }, 201);
  } catch (error) {
    console.error("Booking reschedule proposal failed", error);
    return json({ error: "Impossible d’enregistrer la proposition." }, 503);
  }
}
