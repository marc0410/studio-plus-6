import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { DEFAULT_CONFIG, DEFAULT_SERVICES, slotTimes, validDate, validateBooking, validateConfig } from "@/lib/studio-domain";
import { ROLE_HOME } from "@/lib/roles";
import { safelySendStudioEmail } from "@/lib/email";
import { spaceOrigin } from "@/lib/hosts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) => NextResponse.json(data, {
  status,
  headers: { "Cache-Control": "no-store" },
});

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const expected = new URL(request.url).origin;
    return new URL(origin).origin === expected;
  } catch {
    return false;
  }
}

async function getConfig() {
  const row = await prisma.studioSettings.findUnique({ where: { key: "config" } });
  return row ? validateConfig(row.value) : DEFAULT_CONFIG;
}

function asApiBooking(booking: {
  id: string; serviceId: string; title: string; date: string; time: string;
  duration: number; amount: number | null; status: string; name: string;
  email: string; phone: string; notes: string; ownerId: string;
  participants: { id: string; name: string; email: string; role: string }[];
  payments: { id: string; amount: number; method: string; paidAt: Date }[];
  project: { id: string } | null;
  scheduleChanges: { id: string; oldDate: string; oldTime: string; newDate: string; newTime: string; status: string; createdAt: Date }[];
}, ownerId: string, isManager: boolean) {
  const amountPaid = booking.payments.reduce((total, payment) => total + payment.amount, 0);
  return {
    ...booking,
    service: booking.serviceId,
    status: booking.status.toLowerCase(),
    amountPaid,
    remainingAmount: booking.amount === null ? null : Math.max(0, booking.amount - amountPaid),
    payments: booking.payments,
    canManage: isManager || booking.ownerId === ownerId,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") ?? "bootstrap";
    const profile = await getCurrentProfile();
    const config = await getConfig();

    if (action === "availability") {
      const date = url.searchParams.get("date");
      if (!validDate(date)) return json({ error: "Date invalide." }, 400);
      const occupied = await prisma.bookingSlot.findMany({
        where: { date, booking: { status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] } } },
        select: { time: true },
      });
      return json({ date, occupied: occupied.map(slot => slot.time), config });
    }

    if (action !== "bootstrap") return json({ error: "Action inconnue." }, 404);
    if (!profile) return json({ me: null, config, bookings: [] });

    const isManager = profile.role === "ADMIN" || profile.role === "MANAGER";
    const where = isManager
      ? {}
      : profile.role === "STAFF"
        ? { assignments: { some: { staffId: profile.id } } }
        : { ownerId: profile.id };
    const records = await prisma.booking.findMany({
      where,
      include: {
        participants: { select: { id: true, name: true, email: true, role: true } },
        payments: { select: { id: true, amount: true, method: true, paidAt: true }, orderBy: { paidAt: "desc" } },
        project: { select: { id: true } },
        scheduleChanges: { select: { id: true, oldDate: true, oldTime: true, newDate: true, newTime: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ date: "desc" }, { time: "desc" }],
      take: 500,
    });
    return json({
      me: {
        id: profile.id,
        name: profile.fullName,
        email: profile.email,
        admin: profile.role === "ADMIN",
        role: profile.role,
        home: ROLE_HOME[profile.role],
      },
      config,
      bookings: records.map(booking => asApiBooking(booking, profile.id, isManager)),
    });
  } catch (error) {
    console.error("Studio read error", error);
    return json({ error: "Impossible de charger les informations du studio. Vérifiez la configuration Supabase et réessayez." }, 503);
  }
}

async function mutate(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Origine de la requête non autorisée." }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 20000) return json({ error: "La demande est trop volumineuse." }, 413);

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 20000) return json({ error: "La demande est trop volumineuse." }, 413);
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json({ error: "Données invalides." }, 400);
  }

  try {
    const profile = await getCurrentProfile();
    if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
    const isManager = profile.role === "ADMIN" || profile.role === "MANAGER";

    if (request.method === "POST" && body.action === "booking") {
      if (profile.role !== "CLIENT") return json({ error: "Seuls les clients peuvent envoyer une demande." }, 403);
      const config = await getConfig();
      const input = { ...body, name: profile.fullName, email: profile.email };
      const service = validateBooking(input, config);
      const pendingCount = await prisma.booking.count({ where: { ownerId: profile.id, status: "REQUESTED" } });
      if (pendingCount >= 12) return json({ error: "Vous avez déjà 12 demandes en attente. Contactez le studio pour les traiter." }, 409);

      const id = crypto.randomUUID();
      const slotList = slotTimes(String(body.time), service.duration);
      try {
        await prisma.$transaction(async tx => {
          await tx.service.upsert({
            where: { id: service.id },
            create: { id: service.id, name: service.name, duration: service.duration, price: service.price, image: service.image },
            update: { name: service.name, duration: service.duration, price: service.price, image: service.image },
          });
          await tx.booking.create({
            data: {
              id,
              ownerId: profile.id,
              serviceId: service.id,
              title: String(body.title).trim(),
              date: String(body.date),
              time: String(body.time),
              duration: service.duration,
              amount: service.price,
              name: profile.fullName,
              email: profile.email,
              phone: String(body.phone).trim(),
              notes: typeof body.notes === "string" ? body.notes.trim() : "",
              expiresAt: new Date(Date.now() + Math.min(168, Math.max(24, Number(process.env.BOOKING_REQUEST_TTL_HOURS) || 48)) * 3600000),
              slots: { create: slotList.map(time => ({ date: String(body.date), time })) },
            },
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
          return json({ error: "Ce créneau vient d’être pris. Choisissez-en un autre." }, 409);
        }
        throw error;
      }
      const appOrigin = spaceOrigin("app");
      const adminOrigin = spaceOrigin("admin");
      await Promise.all([
        safelySendStudioEmail({
          to: profile.email,
          subject: "Votre demande de séance est bien reçue",
          title: "Votre demande est arrivée au studio.",
          body: `${service.name} · ${body.date} à ${body.time}. L’équipe Studio+ vous confirmera le créneau et le montant. Aucun paiement en ligne n’est demandé.`,
          actionLabel: "Ouvrir mon espace",
          actionUrl: `${appOrigin}/`,
          event: "BOOKING_REQUESTED_CLIENT",
        }),
        process.env.STUDIO_BOOKING_EMAIL ? safelySendStudioEmail({
          to: process.env.STUDIO_BOOKING_EMAIL,
          subject: "Nouvelle demande de réservation",
          title: "Une nouvelle demande attend votre réponse.",
          body: `${profile.fullName} · ${service.name} · ${body.date} à ${body.time}.`,
          actionLabel: "Ouvrir la gestion",
          actionUrl: `${adminOrigin}/reservations`,
          event: "BOOKING_REQUESTED_STUDIO",
        }) : Promise.resolve(false),
      ]);
      return json({ id, message: "Votre demande est enregistrée. Le studio doit encore confirmer la séance et le tarif." }, 201);
    }

    if (request.method === "PATCH" && body.action === "booking") {
      const id = typeof body.id === "string" ? body.id : "";
      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking || (!isManager && booking.ownerId !== profile.id)) return json({ error: "Séance introuvable ou accès non autorisé." }, 404);
      if (body.status === "confirmed") {
        if (!isManager) return json({ error: "Seul le studio peut confirmer une séance." }, 403);
        if (booking.status !== "REQUESTED") return json({ error: "Seule une demande en attente peut être confirmée." }, 409);
        if (!Number.isSafeInteger(body.amount) || Number(body.amount) < 0 || Number(body.amount) > 100000000) {
          return json({ error: "Renseignez le montant total validé avant de confirmer." }, 400);
        }
        const confirmed = await prisma.$transaction(async tx => {
          const changed = await tx.booking.updateMany({ where: { id, status: "REQUESTED" }, data: { status: "CONFIRMED", amount: Number(body.amount) } });
          if (!changed.count) return false;
          const project = await tx.studioProject.upsert({
            where: { bookingId: id },
            create: { bookingId: id, title: booking.title },
            update: {},
          });
          if (await tx.projectTask.count({ where: { projectId: project.id } }) === 0) {
            await tx.projectTask.createMany({ data: [
              { projectId: project.id, title: "Préparation de la séance", sortOrder: 1 },
              { projectId: project.id, title: "Réalisation", sortOrder: 2 },
              { projectId: project.id, title: "Post-production et livrables", sortOrder: 3 },
            ] });
          }
          return true;
        });
        if (!confirmed) return json({ error: "Cette demande a déjà été traitée." }, 409);
        await safelySendStudioEmail({
          to: booking.email,
          subject: "Votre séance Studio+ est confirmée",
          title: "Votre séance est confirmée.",
          body: `${booking.title} · ${booking.date} à ${booking.time}. Montant convenu : ${new Intl.NumberFormat("fr-FR").format(Number(body.amount))} FCFA. Le paiement se fera sur place.`,
          actionLabel: "Voir ma réservation",
          actionUrl: `${spaceOrigin("app")}/`,
          event: "BOOKING_CONFIRMED",
        });
        return json({ ok: true, message: "La séance est confirmée." });
      }
      if (body.status === "cancelled") {
        if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(booking.status)) return json({ error: "Cette séance ne peut plus être annulée." }, 409);
        if (!isManager && await prisma.bookingPayment.count({ where: { bookingId: id } }) > 0) return json({ error: "Un paiement a été enregistré. Contactez le studio pour annuler." }, 409);
        const cancelled = await prisma.$transaction(async tx => {
          const changed = await tx.booking.updateMany({ where: { id, status: booking.status }, data: { status: "CANCELLED" } });
          if (!changed.count) return false;
          await tx.bookingSlot.deleteMany({ where: { bookingId: id } });
          return true;
        });
        if (!cancelled) return json({ error: "Cette séance a été modifiée entre-temps. Actualisez la page." }, 409);
        await safelySendStudioEmail({
          to: booking.email,
          subject: "Mise à jour de votre séance Studio+",
          title: "Votre séance a été annulée.",
          body: `${booking.title} · ${booking.date} à ${booking.time}. Contactez le studio si vous souhaitez choisir un autre créneau.`,
          actionLabel: "Faire une nouvelle demande",
          actionUrl: `${spaceOrigin("app")}/reserver`,
          event: "BOOKING_CANCELLED",
        });
        return json({ ok: true, message: "La séance est annulée." });
      }
      return json({ error: "Statut invalide." }, 400);
    }

    if (request.method === "POST" && body.action === "participant") {
      const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking || (!isManager && booking.ownerId !== profile.id)) return json({ error: "Vous ne pouvez pas modifier les participants de cette séance." }, 403);
      if (booking.status === "CANCELLED") return json({ error: "Cette séance est annulée." }, 409);
      if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.length > 100 || typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || !["Invité", "Co-intervenant", "Technicien"].includes(String(body.role))) {
        return json({ error: "Vérifiez le nom, l’e-mail et le rôle." }, 400);
      }
      const participantCount = await prisma.bookingParticipant.count({ where: { bookingId } });
      if (participantCount >= 20) return json({ error: "Cette séance contient déjà 20 participants." }, 400);
      const rawToken = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      try {
        await prisma.$transaction([
          prisma.bookingParticipant.create({ data: { bookingId, name: body.name.trim(), email: body.email.trim().toLowerCase(), role: String(body.role) } }),
          prisma.guestInvitation.create({ data: {
            bookingId,
            name: body.name.trim(),
            email: body.email.trim().toLowerCase(),
            tokenHash,
            expiresAt: new Date(Date.now() + 30 * 86400000),
          } }),
        ]);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return json({ error: "Cette personne est déjà ajoutée à la séance." }, 409);
        throw error;
      }
      const inviteUrl = `${spaceOrigin("www")}/invite/${rawToken}`;
      const emailSent = await safelySendStudioEmail({
        to: body.email.trim().toLowerCase(),
        subject: "Studio+ vous invite à une séance podcast",
        title: "Vous êtes invité(e) au studio.",
        body: `Bonjour ${body.name.trim()}, vous êtes invité(e) à participer à « ${booking.title} », le ${booking.date} à ${booking.time}. Répondez à l’invitation en suivant le lien.`,
        actionLabel: "Répondre à l’invitation",
        actionUrl: inviteUrl,
        event: "PODCAST_INVITATION",
      });
      return json({ ok: true, emailSent, inviteUrl, message: emailSent ? "Participant ajouté et invitation envoyée." : "Participant ajouté. L’envoi d’e-mail doit être configuré ou relancé." }, 201);
    }

    if (request.method === "DELETE" && body.action === "participant") {
      const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking || (!isManager && booking.ownerId !== profile.id)) return json({ error: "Accès non autorisé." }, 403);
      const participantId = String(body.id ?? "");
      const participant = await prisma.bookingParticipant.findUnique({ where: { id: participantId } });
      if (!participant || participant.bookingId !== bookingId) return json({ error: "Participant introuvable." }, 404);
      await prisma.$transaction([
        prisma.guestInvitation.deleteMany({ where: { bookingId, email: participant.email } }),
        prisma.bookingParticipant.delete({ where: { id: participantId } }),
      ]);
      return json({ ok: true });
    }

    if (request.method === "PATCH" && body.action === "config") {
      if (profile.role !== "ADMIN") return json({ error: "Accès administrateur requis." }, 403);
      const config = validateConfig(body.config);
      await prisma.studioSettings.upsert({
        where: { key: "config" },
        create: { key: "config", value: config as Prisma.InputJsonValue },
        update: { value: config as Prisma.InputJsonValue },
      });
      return json({ config });
    }

    return json({ error: "Action inconnue." }, 400);
  } catch (error) {
    console.error("Studio mutation error", error);
    return json({ error: "L’enregistrement a échoué. Vérifiez la connexion au studio puis réessayez." }, 503);
  }
}

export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
