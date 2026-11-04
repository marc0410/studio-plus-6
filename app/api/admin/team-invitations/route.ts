import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSupabaseAuthEmail } from "@/lib/supabase/auth-email";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorize() {
  const profile = await getCurrentProfile();
  if (!profile) return { error: Response.json({ error: "Connectez-vous pour continuer." }, { status: 401 }) };
  if (profile.role !== "ADMIN") return { error: Response.json({ error: "Accès administrateur requis." }, { status: 403 }) };
  return { profile };
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  try { return !!origin && new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

function digest(token: string) { return createHash("sha256").update(token).digest("hex"); }

async function sendInvite(userId: string, tokenHash?: string) {
  const invitation = await prisma.teamInvitation.findUnique({ where: { userId } });
  if (!invitation || invitation.status !== "PENDING") return Response.json({ error: "Cette invitation n’est plus en attente." }, { status: 409 });
  const appUrl = process.env.APP_URL;
  if (!appUrl) return Response.json({ error: "APP_URL n’est pas configurée." }, { status: 503 });
  const admin = createSupabaseAdminClient();
  if (!tokenHash) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email: invitation.email,
      options: { data: { full_name: invitation.fullName }, redirectTo: `${appUrl}/auth/callback?next=${invitation.role === "STAFF" ? "%2Fequipe" : "%2Fgestion"}` },
    });
    if (error || !data.properties.hashed_token) {
      console.error("Could not generate internal team invitation", error?.message);
      return Response.json({ error: "Supabase n’a pas pu créer le lien d’invitation." }, { status: 502 });
    }
    tokenHash = data.properties.hashed_token;
  }
  const nextExpiry = new Date(Date.now() + 7 * 86400000);
  await prisma.teamInvitation.update({ where: { userId }, data: { tokenDigest: digest(tokenHash), expiresAt: nextExpiry } });
  const next = invitation.role === "STAFF" ? "/equipe" : "/gestion";
  const actionLink = `${appUrl.replace(/\/$/, "")}/auth/accept-invite?token_hash=${encodeURIComponent(tokenHash)}&next=${encodeURIComponent(next)}`;
  try {
    await sendSupabaseAuthEmail({
      to: invitation.email,
      subject: "Votre invitation à rejoindre Studio+",
      intro: `Bonjour ${invitation.fullName}, rejoignez l’équipe Studio+ et activez votre espace ${invitation.role === "STAFF" ? "équipe" : "gestion"}.`,
      action: "Activer mon accès",
      link: actionLink!,
    }, `team-invite-${invitation.userId}-${crypto.randomUUID()}`, "TEAM_INVITATION");
  } catch (cause) {
    console.error("Internal team invitation email failed", cause instanceof Error ? cause.message : cause);
    return Response.json({ error: "Le compte est prêt, mais Resend n’a pas envoyé l’invitation. Vous pouvez la renvoyer." }, { status: 502 });
  }
  return Response.json({ ok: true, message: "Invitation envoyée." });
}

export async function POST(request: Request) {
  const access = await authorize();
  if ("error" in access) return access.error;
  if (!sameOrigin(request)) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  try {
    const body = await request.json() as { name?: unknown; email?: unknown; role?: unknown; resendUserId?: unknown };
    if (typeof body.resendUserId === "string") return sendInvite(body.resendUserId);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role;
    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (role !== "STAFF" && role !== "MANAGER")) {
      return Response.json({ error: "Renseignez un nom, un e-mail valide et un rôle d’équipe." }, { status: 400 });
    }

    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      const previousInvite = await prisma.teamInvitation.findUnique({ where: { userId: existing.id } });
      if (previousInvite && ["PENDING", "REVOKED"].includes(previousInvite.status)) {
        const admin = createSupabaseAdminClient();
        if (previousInvite.status === "REVOKED") {
          const { error: unbanError } = await admin.auth.admin.updateUserById(existing.id, { ban_duration: "none" });
          if (unbanError) throw unbanError;
        }
        await prisma.$transaction([
          prisma.profile.update({ where: { id: existing.id }, data: { role, fullName: name, isActive: true } }),
          prisma.teamInvitation.update({ where: { userId: existing.id }, data: { email, fullName: name, role, status: "PENDING", revokedAt: null, acceptedAt: null, expiresAt: new Date(Date.now() + 7 * 86400000) } }),
        ]);
        const sent = await sendInvite(existing.id);
        if (!sent.ok) return sent;
        return Response.json({ ok: true, existing: true, message: "Une nouvelle invitation a été envoyée." });
      }
      const profile = await prisma.profile.update({ where: { id: existing.id }, data: { role, fullName: name, isActive: true } });
      return Response.json({ ok: true, existing: true, message: `Le compte existant a maintenant le rôle ${profile.role}.` });
    }

    const appUrl = process.env.APP_URL;
    if (!appUrl) return Response.json({ error: "APP_URL n’est pas configurée." }, { status: 503 });
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: { full_name: name }, redirectTo: `${appUrl}/auth/callback?next=${role === "STAFF" ? "%2Fequipe" : "%2Fgestion"}` },
    });
    if (error || !data.user || !data.properties.hashed_token) {
      console.error("Internal team account creation failed", error?.message);
      return Response.json({ error: "Impossible de créer cette invitation. Vérifiez si l’adresse possède déjà un compte." }, { status: 409 });
    }

    const expiresAt = new Date(Date.now() + 7 * 86400000);
    await prisma.$transaction([
      prisma.profile.create({ data: { id: data.user.id, email, fullName: name, role, isActive: true } }),
      prisma.teamInvitation.create({ data: { userId: data.user.id, invitedBy: access.profile.id, email, fullName: name, role, expiresAt, tokenDigest: digest(data.properties.hashed_token) } }),
    ]);
    const sent = await sendInvite(data.user.id, data.properties.hashed_token);
    if (!sent.ok) return sent;
    return Response.json({ ok: true, message: `Invitation envoyée. Elle expire le ${expiresAt.toLocaleDateString("fr-FR", { timeZone: "Africa/Abidjan" })}.` }, { status: 201 });
  } catch (error) {
    console.error("Internal team invitation failed", error);
    return Response.json({ error: "L’invitation n’a pas pu être créée." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const access = await authorize();
  if ("error" in access) return access.error;
  if (!sameOrigin(request)) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  try {
    const body = await request.json() as { userId?: unknown };
    if (typeof body.userId !== "string") return Response.json({ error: "Invitation invalide." }, { status: 400 });
    const invitation = await prisma.teamInvitation.findUnique({ where: { userId: body.userId } });
    if (!invitation || invitation.status !== "PENDING") return Response.json({ error: "Invitation en attente introuvable." }, { status: 404 });
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(body.userId, { ban_duration: "876000h" });
    if (error) throw error;
    await prisma.$transaction([
      prisma.profile.update({ where: { id: body.userId }, data: { isActive: false } }),
      prisma.teamInvitation.update({ where: { userId: body.userId }, data: { status: "REVOKED", revokedAt: new Date() } }),
    ]);
    return Response.json({ ok: true, message: "Invitation révoquée." });
  } catch (error) {
    console.error("Internal team invitation revocation failed", error);
    return Response.json({ error: "L’invitation n’a pas pu être révoquée." }, { status: 503 });
  }
}
