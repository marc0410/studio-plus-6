import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { createSupabaseAdminClient, STUDIO_DELIVERABLES_BUCKET } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; deliverableId: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Connectez-vous pour continuer." }, { status: 401 });
  const { id, deliverableId } = await params;
  const manager = ["ADMIN", "MANAGER"].includes(profile.role);
  const deliverable = await prisma.projectDeliverable.findFirst({
    where: { id: deliverableId, projectId: id, ...(profile.role === "CLIENT" ? { visibleAt: { not: null } } : {}) , project: { booking: manager ? {} : profile.role === "STAFF" ? { assignments: { some: { staffId: profile.id } } } : { ownerId: profile.id } } },
  });
  if (!deliverable) return NextResponse.json({ error: "Fichier introuvable ou accès non autorisé." }, { status: 404 });
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(STUDIO_DELIVERABLES_BUCKET).createSignedUrl(deliverable.objectPath, 60, { download: deliverable.name });
    if (error || !data?.signedUrl) throw error ?? new Error("Lien de téléchargement indisponible.");
    return NextResponse.json({ url: data.signedUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Private deliverable signing failed", error);
    return NextResponse.json({ error: "Le téléchargement n’est pas disponible pour le moment." }, { status: 503 });
  }
}
