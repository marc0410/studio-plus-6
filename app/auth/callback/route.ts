import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isLegacySingleHost, spaceFromHost } from "@/lib/hosts";

function safeNextPath(value: string | null, request: NextRequest) {
  const host = request.headers.get("host");
  const legacy = isLegacySingleHost(host);
  const space = spaceFromHost(host);
  const fallback = legacy ? "/espace" : "/";
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return fallback;
  const pathname = value.split("?", 1)[0];
  if (legacy) return value;
  if (space === "app" && ["/", "/nouveau-mot-de-passe", "/reserver"].some(path => pathname === path || pathname.startsWith(`${path}/`))) return value;
  if ((space === "team" || space === "admin") && ["/", "/nouveau-mot-de-passe"].some(path => pathname === path || pathname.startsWith(`${path}/`))) return value;
  return fallback;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"), request);
  if (!code) return NextResponse.redirect(new URL("/connexion?error=confirmation", request.url));

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user?.email) throw error ?? new Error("Compte e-mail manquant.");
    await prisma.profile.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        email: data.user.email.toLowerCase(),
        fullName: String(data.user.user_metadata?.full_name ?? data.user.email.split("@")[0]),
        role: "CLIENT",
      },
      update: { email: data.user.email.toLowerCase() },
    });
    await prisma.teamInvitation.updateMany({ where: { userId: data.user.id, status: "PENDING", expiresAt: { gt: new Date() } }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error("Supabase auth callback failed", error);
    return NextResponse.redirect(new URL("/connexion?error=callback", request.url));
  }
}
