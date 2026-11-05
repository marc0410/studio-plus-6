import { prisma } from "@/lib/prisma";
import { hasSameOrigin } from "@/lib/request-security";
import { getCurrentProfile } from "@/lib/current-profile";
import { APP_ROLES } from "@/lib/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function authorize() {
  const profile = await getCurrentProfile();
  if (!profile) return { error: Response.json({ error: "Connectez-vous pour continuer." }, { status: 401 }) };
  if (profile.role !== "ADMIN") return { error: Response.json({ error: "Accès administrateur requis." }, { status: 403 }) };
  return { profile };
}

export async function GET() {
  const access = await authorize();
  if ("error" in access) return access.error;
  try {
    const users = await prisma.profile.findMany({ orderBy: [{ role: "asc" }, { fullName: "asc" }], select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } });
    const invitations = await prisma.teamInvitation.findMany({ where: { userId: { in: users.map(user => user.id) } }, select: { userId: true, status: true, expiresAt: true, acceptedAt: true } });
    const byUser = new Map(invitations.map(invitation => [invitation.userId, invitation]));
    return Response.json({ users: users.map(user => ({ ...user, invitation: byUser.get(user.id) ?? null })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin user list failed", error);
    return Response.json({ error: "La liste des comptes est indisponible." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const access = await authorize();
  if ("error" in access) return access.error;
  const origin = request.headers.get("origin");
  if (!hasSameOrigin(request)) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  try {
    const body = await request.json() as { id?: unknown; role?: unknown; isActive?: unknown };
    if (typeof body.id !== "string" || !APP_ROLES.includes(body.role as typeof APP_ROLES[number]) || (body.isActive !== undefined && typeof body.isActive !== "boolean")) {
      return Response.json({ error: "Compte ou rôle invalide." }, { status: 400 });
    }
    if (body.id === access.profile.id && body.role !== "ADMIN") return Response.json({ error: "Vous ne pouvez pas retirer votre propre accès administrateur." }, { status: 409 });
    const current = await prisma.profile.findUnique({ where: { id: body.id } });
    if (!current) return Response.json({ error: "Compte introuvable." }, { status: 404 });
    if (current.role === "ADMIN" && body.role !== "ADMIN") {
      const admins = await prisma.profile.count({ where: { role: "ADMIN", isActive: true } });
      if (admins <= 1) return Response.json({ error: "Conservez au moins un compte administrateur actif." }, { status: 409 });
    }
    if (body.isActive === true && !current.isActive) {
      const { error: unbanError } = await createSupabaseAdminClient().auth.admin.updateUserById(body.id, { ban_duration: "none" });
      if (unbanError) throw unbanError;
    }
    const user = await prisma.profile.update({ where: { id: body.id }, data: { role: body.role as typeof APP_ROLES[number], ...(body.isActive !== undefined ? { isActive: body.isActive } : {}) } });
    return Response.json({ ok: true, user: { id: user.id, role: user.role, isActive: user.isActive } });
  } catch (error) {
    console.error("Admin role update failed", error);
    return Response.json({ error: "Le compte n’a pas pu être modifié." }, { status: 503 });
  }
}
