import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { safelySendStudioEmail } from "@/lib/email";

export const runtime = "nodejs";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
function sameOrigin(request: Request) { const origin = request.headers.get("origin"); try { return !!origin && new URL(origin).origin === (process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin); } catch { return false; } }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  if (!["ADMIN", "MANAGER"].includes(profile.role)) return json({ error: "Accès gestion requis." }, 403);
  const { id } = await params;
  const [booking, staff, assignments] = await Promise.all([
    prisma.booking.findUnique({ where: { id }, select: { id: true } }),
    prisma.profile.findMany({ where: { role: "STAFF", isActive: true }, select: { id: true, fullName: true, email: true }, orderBy: { fullName: "asc" } }),
    prisma.bookingStaff.findMany({ where: { bookingId: id }, select: { staffId: true } }),
  ]);
  if (!booking) return json({ error: "Réservation introuvable." }, 404);
  return json({ staff, assignedIds: assignments.map(item => item.staffId) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  if (!["ADMIN", "MANAGER"].includes(profile.role)) return json({ error: "Accès gestion requis." }, 403);
  const { id } = await params;
  let body: { staffId?: unknown };
  try { body = await request.json() as typeof body; } catch { return json({ error: "Données invalides." }, 400); }
  if (typeof body.staffId !== "string") return json({ error: "Choisissez un membre de l’équipe." }, 400);
  const [booking, staff] = await Promise.all([
    prisma.booking.findUnique({ where: { id }, select: { id: true, date: true, time: true, duration: true, title: true, status: true } }),
    prisma.profile.findFirst({ where: { id: body.staffId, role: "STAFF", isActive: true }, select: { id: true, email: true, fullName: true } }),
  ]);
  if (!booking || !staff) return json({ error: "Réservation ou membre introuvable." }, 404);
  if (["REQUESTED", "CONFIRMED", "IN_PROGRESS"].includes(booking.status)) {
    const sameDay = await prisma.bookingStaff.findMany({ where: { staffId: staff.id, bookingId: { not: id }, booking: { date: booking.date, status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] } } }, select: { booking: { select: { time: true, duration: true, title: true } } } });
    const start = minutes(booking.time), end = start + booking.duration;
    const conflict = sameDay.find(({ booking: other }) => start < minutes(other.time) + other.duration && minutes(other.time) < end);
    if (conflict) return json({ error: `Conflit avec « ${conflict.booking.title} » à ${conflict.booking.time}.` }, 409);
  }
  const existed = await prisma.bookingStaff.findUnique({ where: { bookingId_staffId: { bookingId: id, staffId: staff.id } } });
  await prisma.bookingStaff.upsert({ where: { bookingId_staffId: { bookingId: id, staffId: staff.id } }, create: { bookingId: id, staffId: staff.id }, update: {} });
  if (!existed) {
    const origin = process.env.APP_URL ?? new URL(request.url).origin;
    await safelySendStudioEmail({ to: staff.email, subject: "Vous êtes affecté à une séance Studio+", title: "Une séance vous a été affectée.", body: `${staff.fullName}, vous êtes affecté à « ${booking.title} » le ${booking.date} à ${booking.time}.`, actionLabel: "Ouvrir la séance", actionUrl: `${origin}/equipe/seances`, event: "STAFF_ASSIGNED" });
  }
  return json({ ok: true, message: "Membre affecté à la séance." }, 201);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  if (!["ADMIN", "MANAGER"].includes(profile.role)) return json({ error: "Accès gestion requis." }, 403);
  const { id } = await params;
  let body: { staffId?: unknown };
  try { body = await request.json() as typeof body; } catch { return json({ error: "Données invalides." }, 400); }
  if (typeof body.staffId !== "string") return json({ error: "Membre introuvable." }, 400);
  const [assignment, booking] = await Promise.all([
    prisma.bookingStaff.findUnique({ where: { bookingId_staffId: { bookingId: id, staffId: body.staffId } }, include: { staff: { select: { email: true, fullName: true } } } }),
    prisma.booking.findUnique({ where: { id }, select: { title: true, date: true, time: true } }),
  ]);
  await prisma.bookingStaff.deleteMany({ where: { bookingId: id, staffId: body.staffId } });
  if (assignment && booking) {
    const origin = process.env.APP_URL ?? new URL(request.url).origin;
    await safelySendStudioEmail({ to: assignment.staff.email, subject: "Votre affectation a changé", title: "Vous avez été retiré d’une séance.", body: `${assignment.staff.fullName}, vous n’êtes plus affecté à « ${booking.title} » le ${booking.date} à ${booking.time}.`, actionLabel: "Ouvrir mon espace", actionUrl: `${origin}/equipe`, event: "STAFF_UNASSIGNED" });
  }
  return json({ ok: true, message: "Affectation retirée." });
}

function minutes(time: string) { const [hours, mins] = time.split(":").map(Number); return hours * 60 + mins; }
