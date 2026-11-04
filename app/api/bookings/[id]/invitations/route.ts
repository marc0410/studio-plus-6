import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { safelySendStudioEmail } from "@/lib/email";

export const runtime = "nodejs";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const roles = ["Invité", "Co-intervenant", "Technicien"];
function sameOrigin(request: Request) { const origin = request.headers.get("origin"); try { return !!origin && new URL(origin).origin === (process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin); } catch { return false; } }

async function allowedBooking(id: string, profile: NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>) {
  const manager = ["ADMIN", "MANAGER"].includes(profile.role);
  return prisma.booking.findFirst({ where: { id, ...(manager ? {} : profile.role === "STAFF" ? { assignments: { some: { staffId: profile.id } } } : { ownerId: profile.id }) } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  const { id } = await params;
  if (!await allowedBooking(id, profile)) return json({ error: "Séance introuvable ou accès non autorisé." }, 404);
  const participants = await prisma.bookingParticipant.findMany({ where: { bookingId: id }, orderBy: { name: "asc" } });
  const invitations = await prisma.guestInvitation.findMany({ where: { bookingId: id }, select: { name: true, email: true, status: true, bio: true, socialLinks: true, imageConsent: true, proposedDate: true, proposedTime: true, note: true } });
  return json({ participants, invitations });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  const { id } = await params;
  const booking = await allowedBooking(id, profile);
  if (!booking) return json({ error: "Séance introuvable ou accès non autorisé." }, 404);
  if (booking.status === "CANCELLED") return json({ error: "Cette séance est annulée." }, 409);
  let body: { name?: unknown; email?: unknown; role?: unknown };
  try { body = await request.json() as typeof body; } catch { return json({ error: "Données invalides." }, 400); }
  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.length > 100 || typeof body.email !== "string" || body.email.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || !roles.includes(String(body.role))) return json({ error: "Vérifiez le nom, l’e-mail et le rôle." }, 400);
  if (await prisma.bookingParticipant.count({ where: { bookingId: id } }) >= 20) return json({ error: "Cette séance contient déjà 20 participants." }, 400);
  const email = body.email.trim().toLowerCase();
  const name = body.name.trim();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  try {
    const participant = await prisma.$transaction(async tx => {
      const person = await tx.bookingParticipant.create({ data: { bookingId: id, name, email, role: String(body.role) } });
      await tx.guestInvitation.create({ data: { bookingId: id, name, email, tokenHash, expiresAt: new Date(Date.now() + 30 * 86400000) } });
      return person;
    });
    const inviteUrl = `${process.env.APP_URL ?? new URL(request.url).origin}/invite/${rawToken}`;
    const emailSent = await safelySendStudioEmail({ to: email, subject: "Studio+ vous invite à une séance podcast", title: "Vous êtes invité(e) au studio.", body: `Bonjour ${name}, vous êtes invité(e) à participer à « ${booking.title} », le ${booking.date} à ${booking.time}. Répondez à l’invitation en suivant le lien.`, actionLabel: "Répondre à l’invitation", actionUrl: inviteUrl, event: "PODCAST_INVITATION" });
    return json({ participant, emailSent, message: emailSent ? "Participant ajouté et invitation envoyée." : "Participant ajouté. L’e-mail pourra être renvoyé en créant une nouvelle invitation." }, 201);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return json({ error: "Cette personne est déjà ajoutée à la séance." }, 409);
    console.error("Participant invitation failed", error);
    return json({ error: "L’invitation n’a pas pu être créée." }, 503);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  const { id } = await params;
  if (!await allowedBooking(id, profile)) return json({ error: "Accès non autorisé." }, 404);
  let body: { participantId?: unknown };
  try { body = await request.json() as typeof body; } catch { return json({ error: "Données invalides." }, 400); }
  if (typeof body.participantId !== "string") return json({ error: "Participant introuvable." }, 400);
  const participant = await prisma.bookingParticipant.findFirst({ where: { id: body.participantId, bookingId: id } });
  if (!participant) return json({ error: "Participant introuvable." }, 404);
  await prisma.$transaction([prisma.guestInvitation.deleteMany({ where: { bookingId: id, email: participant.email } }), prisma.bookingParticipant.delete({ where: { id: participant.id } })]);
  return json({ ok: true });
}
