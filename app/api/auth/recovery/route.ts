import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== new URL(request.url).origin) return Response.json({ error: "Origine non autorisée." }, { status: 403 });
  try {
    const body = await request.json() as { email?: unknown };
    if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return Response.json({ error: "Renseignez une adresse e-mail valide." }, { status: 400 });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(body.email.trim().toLowerCase(), {
      redirectTo: `${process.env.APP_URL ?? new URL(request.url).origin}/auth/callback?next=%2Fnouveau-mot-de-passe`,
    });
    if (error) throw error;
    return Response.json({ ok: true, message: "Si un compte correspond à cette adresse, un lien de récupération vient d’être envoyé." });
  } catch (error) {
    console.error("Password recovery failed", error);
    return Response.json({ error: "L’envoi du lien est indisponible. Réessayez dans un instant." }, { status: 503 });
  }
}
