import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";

export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? "",
      fullName: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Client"),
      role: "CLIENT",
    },
    update: { email: user.email ?? "" },
  });
  if (!profile.isActive) return null;
  return profile;
}

export async function requireRole(roles: AppRole[], returnTo = "/espace") {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/connexion?return_to=${encodeURIComponent(returnTo)}`);
  if (!roles.includes(profile.role as AppRole)) redirect("/non-autorise");
  return profile;
}
