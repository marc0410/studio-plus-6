import "server-only";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME } from "@/lib/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canonicalSpaceForRole, isLegacySingleHost, roleAllowedOnSpace, spaceFromHost, spaceOrigin } from "@/lib/hosts";

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

async function readBody(request: Request) {
  const raw = await request.text();
  if (raw.length > 4096) throw new Error("La demande est trop volumineuse.");
  return JSON.parse(raw) as Record<string, unknown>;
}

async function syncProfile(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  if (!user.email) throw new Error("Votre compte ne contient pas d’adresse e-mail vérifiée.");
  return prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email.toLowerCase(),
      fullName: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email.split("@")[0]),
      role: "CLIENT",
    },
    update: { email: user.email.toLowerCase() },
  });
}

export async function signIn(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await readBody(request); } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Données invalides." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 200) {
    return Response.json({ error: "E-mail ou mot de passe invalide." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return Response.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
    const profile = await syncProfile(data.user);
    if (!profile.isActive) {
      await supabase.auth.signOut();
      return Response.json({ error: "Ce compte est désactivé. Contactez le studio." }, { status: 403 });
    }
    const host = new URL(request.url).host;
    const space = spaceFromHost(host);
    if (space && !isLegacySingleHost(host) && space !== "www" && !roleAllowedOnSpace(profile.role, space)) {
      await supabase.auth.signOut();
      const correctSpace = canonicalSpaceForRole(profile.role);
      return Response.json({ error: "Ce compte n’a pas accès à cet espace.", correctUrl: `${spaceOrigin(correctSpace)}/connexion` }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    const home = space && !isLegacySingleHost(host) && space !== "www" ? "/" : ROLE_HOME[profile.role];
    return Response.json({ ok: true, role: profile.role, home }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Supabase sign-in failed", error);
    return Response.json({ error: "Connexion indisponible. Vérifiez la configuration Supabase puis réessayez." }, { status: 503 });
  }
}

export async function signUp(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await readBody(request); } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Données invalides." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 200) {
    return Response.json({ error: "Vérifiez votre nom, votre e-mail et votre mot de passe (12 caractères minimum)." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback?next=${encodeURIComponent(spaceFromHost(new URL(request.url).host) === "app" ? "/" : "/espace")}`,
      },
    });
    if (error) return Response.json({ error: "Impossible de créer le compte. Vérifiez l’adresse e-mail ou réessayez." }, { status: 400 });
    if (data.user && data.session) await syncProfile(data.user);
    return Response.json({
      ok: true,
      needsEmailConfirmation: !data.session,
      message: data.session ? "Votre compte est prêt." : "Consultez votre boîte e-mail pour confirmer votre compte.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Supabase sign-up failed", error);
    return Response.json({ error: "Création de compte indisponible. Réessayez dans un instant." }, { status: 503 });
  }
}

export async function signOut(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Supabase sign-out failed", error);
    return Response.json({ error: "Déconnexion impossible. Réessayez." }, { status: 503 });
  }
}
