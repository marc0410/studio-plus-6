import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { safelySendStudioEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const invitation = await prisma.guestInvitation.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { booking: { include: { service: true } } },
    });
    if (!invitation) return Response.json({ error: "Invitation introuvable." }, { status: 404 });
    if (invitation.expiresAt < new Date()) return Response.json({ error: "Cette invitation a expiré." }, { status: 410 });
    return Response.json({
      invitation: {
        name: invitation.name,
        status: invitation.status.toLowerCase(),
        note: invitation.note,
        bio: invitation.bio,
        socialLinks: invitation.socialLinks,
        rundown: invitation.rundown,
        imageConsent: invitation.imageConsent,
        proposedDate: invitation.proposedDate,
        proposedTime: invitation.proposedTime,
        expiresAt: invitation.expiresAt,
        booking: { service: invitation.booking.service.name, title: invitation.booking.title, date: invitation.booking.date, time: invitation.booking.time },
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Invitation lookup failed", error);
    return Response.json({ error: "L’invitation est momentanément indisponible." }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== new URL(request.url).origin) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  try {
    const { token } = await params;
    const body = await request.json() as { response?: unknown; note?: unknown; bio?: unknown; socialLinks?: unknown; imageConsent?: unknown; proposedDate?: unknown; proposedTime?: unknown };
    const status = body.response === "accept" ? "ACCEPTED" : body.response === "decline" ? "DECLINED" : null;
    if (!status || (body.note !== undefined && (typeof body.note !== "string" || body.note.length > 500)) || (body.bio !== undefined && (typeof body.bio !== "string" || body.bio.length > 500))) return Response.json({ error: "Choisissez accepter ou décliner et vérifiez les champs." }, { status: 400 });
    let socialLinks: Record<string, string> | undefined;
    if (body.socialLinks !== undefined) {
      if (!body.socialLinks || typeof body.socialLinks !== "object" || Array.isArray(body.socialLinks) || Object.keys(body.socialLinks).length > 4) return Response.json({ error: "Liens sociaux invalides." }, { status: 400 });
      socialLinks = {};
      for (const [key, value] of Object.entries(body.socialLinks as Record<string, unknown>)) {
        if (typeof value !== "string" || value.length > 300) return Response.json({ error: "Vérifiez vos liens sociaux." }, { status: 400 });
        try { const url = new URL(value); if (!(["https:", "http:"].includes(url.protocol))) throw new Error(); socialLinks[key] = url.toString(); }
        catch { return Response.json({ error: "Chaque lien social doit être une URL valide." }, { status: 400 }); }
      }
    }
    if (body.proposedDate !== undefined && (typeof body.proposedDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.proposedDate) || typeof body.proposedTime !== "string" || !/^\d{2}:(00|30)$/.test(body.proposedTime))) return Response.json({ error: "Vérifiez la date et l’heure proposées." }, { status: 400 });
    const result = await prisma.guestInvitation.updateMany({
      where: { tokenHash: tokenHash(token), status: "INVITED", expiresAt: { gt: new Date() } },
      data: {
        status,
        note: typeof body.note === "string" ? body.note.trim() || null : null,
        bio: typeof body.bio === "string" ? body.bio.trim() || null : null,
        ...(socialLinks ? { socialLinks } : {}),
        ...(body.imageConsent === true ? { imageConsent: true, imageConsentAt: new Date() } : {}),
        ...(typeof body.proposedDate === "string" ? { proposedDate: body.proposedDate, proposedTime: body.proposedTime as string } : {}),
        respondedAt: new Date(),
      },
    });
    if (!result.count) return Response.json({ error: "Cette invitation est expirée, introuvable ou déjà traitée." }, { status: 410 });
    const invitation = await prisma.guestInvitation.findUnique({ where: { tokenHash: tokenHash(token) }, include: { booking: { select: { title: true, date: true, time: true } } } });
    if (invitation && process.env.STUDIO_BOOKING_EMAIL) await safelySendStudioEmail({
      to: process.env.STUDIO_BOOKING_EMAIL,
      subject: "Réponse à une invitation Studio+",
      title: "Un invité a répondu.",
      body: `${invitation.name} a ${status === "ACCEPTED" ? "accepté" : "décliné"} l’invitation pour « ${invitation.booking.title} » (${invitation.booking.date} à ${invitation.booking.time}).${invitation.proposedDate ? ` Créneau proposé : ${invitation.proposedDate} à ${invitation.proposedTime}.` : ""}`,
      actionLabel: "Ouvrir la gestion",
      actionUrl: `${process.env.APP_URL ?? new URL(request.url).origin}/gestion/reservations`,
      event: "PODCAST_INVITATION_RESPONSE",
    });
    return Response.json({ ok: true, message: status === "ACCEPTED" ? "Votre présence est confirmée." : "Votre réponse a été transmise au studio." });
  } catch (error) {
    console.error("Invitation response failed", error);
    return Response.json({ error: "Votre réponse n’a pas pu être enregistrée." }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== new URL(request.url).origin) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  try {
    const { token } = await params;
    const body = await request.json() as { imageConsent?: unknown };
    if (typeof body.imageConsent !== "boolean") return Response.json({ error: "Choisissez l’état du consentement." }, { status: 400 });
    const updated = await prisma.guestInvitation.updateMany({
      where: { tokenHash: tokenHash(token), expiresAt: { gt: new Date() }, status: { in: ["ACCEPTED", "DECLINED"] } },
      data: body.imageConsent
        ? { imageConsent: true, imageConsentAt: new Date(), imageConsentRevokedAt: null }
        : { imageConsent: false, imageConsentRevokedAt: new Date() },
    });
    if (!updated.count) return Response.json({ error: "Invitation introuvable ou expirée." }, { status: 410 });
    return Response.json({ ok: true, message: body.imageConsent ? "Consentement enregistré." : "Votre consentement a été retiré." });
  } catch (error) {
    console.error("Invitation consent update failed", error);
    return Response.json({ error: "Le consentement n’a pas pu être mis à jour." }, { status: 503 });
  }
}
