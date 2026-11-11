import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { DEFAULT_CONFIG, slotTimes, validateBooking, validateConfig } from "@/lib/studio-domain";
import { ROLE_HOME } from "@/lib/roles";
import { safelySendStudioEmail } from "@/lib/email";
import { spaceOrigin } from "@/lib/hosts";
import { expirePendingBookings } from "@/lib/booking-expiration";
import { PODCAST_DECORS, getDeposit, getFormulaDecorOptions, getPlan, getPlanDepositWording } from "@/data/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === (new URL(request.url).origin); }
  catch { return false; }
}
async function readConfig() {
  const row = await prisma.studioSettings.findUnique({ where: { key: "config" } });
  return row ? validateConfig(row.value) : DEFAULT_CONFIG;
}

export async function GET(request: Request) {
  try {
    const profile = await getCurrentProfile();
    const config = await readConfig();
    if (!profile) return json({ me: null, config, bookings: [] });
    const isManager = ["ADMIN", "MANAGER"].includes(profile.role);
    const params = new URL(request.url).searchParams;
    const where: Prisma.BookingWhereInput = isManager ? {} : profile.role === "STAFF" ? { assignments: { some: { staffId: profile.id } } } : { ownerId: profile.id };
    let page = 1, pageSize = 500;
    if (isManager) {
      const requestedPage = Number(params.get("page"));
      const requestedSize = Number(params.get("pageSize"));
      page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
      pageSize = Number.isInteger(requestedSize) ? Math.min(100, Math.max(10, requestedSize)) : 20;
      const q = params.get("q")?.trim();
      const status = params.get("status")?.toUpperCase();
      const from = params.get("from"), to = params.get("to");
      const service = params.get("service"), staff = params.get("staff");
      if (q) where.OR = ["name", "email", "phone", "title", "id"].map(field => ({ [field]: { contains: q, mode: "insensitive" } }));
      if (["REQUESTED", "CONFIRMED", "IN_PROGRESS", "CANCELLED", "COMPLETED", "NO_SHOW"].includes(status ?? "")) where.status = status as Prisma.EnumBookingStatusFilter["equals"];
      if (service) where.serviceId = service;
      if (staff) where.assignments = { some: { staffId: staff } };
      if (from || to) where.date = { ...(from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? { gte: from } : {}), ...(to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? { lte: to } : {}) };
    }
    const [total, staffOptions] = isManager ? await Promise.all([
      prisma.booking.count({ where }),
      prisma.profile.findMany({ where: { role: "STAFF", isActive: true }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
    ]) : [0, [] as { id: string; fullName: string }[]];
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        participants: { select: { id: true, name: true, email: true, role: true } },
        payments: { select: { id: true, amount: true, method: true, paidAt: true }, orderBy: { paidAt: "desc" } },
        project: { select: { id: true } },
        scheduleChanges: { select: { id: true, oldDate: true, oldTime: true, newDate: true, newTime: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ date: "desc" }, { time: "desc" }], take: pageSize, skip: isManager ? (page - 1) * pageSize : 0,
    });
    return json({ me: { id: profile.id, name: profile.fullName, email: profile.email, admin: profile.role === "ADMIN", role: profile.role, home: ROLE_HOME[profile.role] }, config, bookings: bookings.map(booking => ({ ...booking, service: booking.serviceId, status: booking.status.toLowerCase(), amountPaid: booking.payments.reduce((sum, payment) => sum + payment.amount, 0), remainingAmount: booking.amount === null ? null : Math.max(0, booking.amount - booking.payments.reduce((sum, payment) => sum + payment.amount, 0)), canManage: isManager || booking.ownerId === profile.id })), ...(isManager ? { pagination: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) }, staffOptions } : {}) });
  } catch (error) {
    console.error("Booking list read failed", error);
    return json({ error: "Impossible de charger les réservations." }, 503);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 20000) return json({ error: "La demande est trop volumineuse." }, 413);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  if (profile.role !== "CLIENT") return json({ error: "Seuls les clients peuvent envoyer une demande." }, 403);
  let body: Record<string, unknown>;
  try { const raw = await request.text(); if (raw.length > 20000) return json({ error: "La demande est trop volumineuse." }, 413); body = JSON.parse(raw) as Record<string, unknown>; }
  catch { return json({ error: "Données invalides." }, 400); }
  try {
    await expirePendingBookings();
    const config = await readConfig();
    const formulaId = typeof body.formule === "string" ? body.formule : "";
    const formula = formulaId ? getPlan(formulaId) : undefined;
    if (formulaId && !formula) return json({ error: "Choisissez une formule valide." }, 400);
    let selectedDecorName = "";
    let participantCount: number | null = null;
    let bookingConfig = config;
    let bookingServiceId = typeof body.service === "string" ? body.service : "";
    if (formula) {
      participantCount = Number(body.intervenants);
      if (!Number.isInteger(participantCount) || participantCount < formula.participantsMin || participantCount > formula.participantsMax) {
        return json({ error: "Choisissez un nombre d’intervenants valide pour cette formule." }, 400);
      }
      if (formula.decorMode === "standard") {
        selectedDecorName = "Décor standard inclus";
        if (body.decor && body.decor !== "standard") return json({ error: "Cette formule comprend un décor standard non modifiable." }, 400);
      } else {
        const decor = PODCAST_DECORS.find(item => item.id === body.decor && item.category === formula.category);
        if (!decor || !getFormulaDecorOptions(formula).some(item => item.id === decor.id)) return json({ error: "Choisissez un décor valide pour cette formule." }, 400);
        selectedDecorName = decor.name;
      }
      bookingServiceId = formula.id;
      bookingConfig = {
        ...config,
        services: [...config.services, {
          id: formula.id,
          name: formula.name,
          tag: formula.category === "duo" ? "Podcast à deux ou plus" : "Podcast solo",
          duration: formula.durationMax,
          price: formula.price,
          description: formula.features.join(" · "),
          image: "studio-session.webp",
          color: "#eb0606",
        }],
      };
    }
    const input = { ...body, service: bookingServiceId, name: profile.fullName, email: profile.email };
    const service = validateBooking(input, bookingConfig);
    if (await prisma.booking.count({ where: { ownerId: profile.id, status: "REQUESTED" } }) >= 12) return json({ error: "Vous avez déjà 12 demandes en attente. Contactez le studio." }, 409);
    const date = String(body.date);
    const time = String(body.time);
    const id = crypto.randomUUID();
    try {
      await prisma.$transaction(async tx => {
        await tx.service.upsert({ where: { id: service.id }, create: { id: service.id, name: service.name, duration: service.duration, price: service.price, image: service.image }, update: { name: service.name, duration: service.duration, price: service.price, image: service.image } });
        const notes = [typeof body.notes === "string" ? body.notes.trim() : ""];
        if (formula) notes.push(`Formule: ${formula.name}`, `Décor: ${selectedDecorName}`, `Intervenants: ${participantCount}`, `Avance à prévoir: ${getDeposit(formula)} Frs`, `Modalités: ${getPlanDepositWording(formula)}`);
        await tx.booking.create({ data: { id, ownerId: profile.id, serviceId: service.id, title: String(body.title).trim(), date, time, duration: service.duration, amount: service.price, name: profile.fullName, email: profile.email, phone: String(body.phone).trim(), notes: notes.filter(Boolean).join("\n"), expiresAt: new Date(Date.now() + Math.min(168, Math.max(24, Number(process.env.BOOKING_REQUEST_TTL_HOURS) || 48)) * 3600000), slots: { create: slotTimes(time, service.duration).map(slot => ({ date, time: slot })) } } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return json({ error: "Ce créneau vient d’être pris. Choisissez-en un autre." }, 409);
      throw error;
    }
    const appOrigin = spaceOrigin("app");
    const adminOrigin = spaceOrigin("admin");
    await Promise.all([
      safelySendStudioEmail({ to: profile.email, subject: "Votre demande de séance est bien reçue", title: "Votre demande est arrivée au studio.", body: `${service.name} · ${date} à ${time}.${formula ? ` ${selectedDecorName} · ${participantCount} intervenant(s) · avance à prévoir ${getDeposit(formula)} Frs.` : " L’équipe vous confirmera le créneau et le montant."} Aucun paiement en ligne n’est demandé.`, actionLabel: "Ouvrir mon espace", actionUrl: `${appOrigin}/`, event: "BOOKING_REQUESTED_CLIENT" }),
      process.env.STUDIO_BOOKING_EMAIL ? safelySendStudioEmail({ to: process.env.STUDIO_BOOKING_EMAIL, subject: "Nouvelle demande de réservation", title: "Une nouvelle demande attend votre réponse.", body: `${profile.fullName} · ${service.name} · ${date} à ${time}.`, actionLabel: "Ouvrir la gestion", actionUrl: `${adminOrigin}/reservations`, event: "BOOKING_REQUESTED_STUDIO" }) : Promise.resolve(false),
    ]);
    return json({ id, message: "Votre demande est enregistrée. Le studio doit encore confirmer la séance et le tarif." }, 201);
  } catch (error) {
    if (error instanceof Error && !(error instanceof Prisma.PrismaClientKnownRequestError)) return json({ error: error.message }, 400);
    console.error("Booking creation failed", error);
    return json({ error: "La réservation n’a pas pu être enregistrée." }, 503);
  }
}
