import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";

const methods = ["CASH", "WAVE", "ORANGE_MONEY", "MTN_MOMO", "BANK_TRANSFER", "OTHER"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return Response.json({ error: "Connectez-vous pour continuer." }, { status: 401 });
  if (!["ADMIN", "MANAGER"].includes(profile.role)) return Response.json({ error: "Seul le studio peut enregistrer un paiement." }, { status: 403 });
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== new URL(request.url).origin) return Response.json({ error: "Origine non autorisée." }, { status: 403 });

  try {
    const { id } = await params;
    const input = await request.json() as { amount?: unknown; method?: unknown; reference?: unknown };
    if (!Number.isSafeInteger(input.amount) || Number(input.amount) <= 0 || Number(input.amount) > 100000000 || !methods.includes(input.method as typeof methods[number])) {
      return Response.json({ error: "Vérifiez le montant et le moyen de paiement." }, { status: 400 });
    }
    if (typeof input.reference === "string" && input.reference.length > 100) return Response.json({ error: "La référence est trop longue." }, { status: 400 });

    const result = await prisma.$transaction(async tx => {
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking) return { error: "Réservation introuvable.", status: 404 } as const;
      if (!["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status) || booking.amount === null) return { error: "Confirmez la séance et son montant avant d’enregistrer un paiement.", status: 409 } as const;
      const existing = await tx.bookingPayment.aggregate({ where: { bookingId: id }, _sum: { amount: true } });
      const alreadyPaid = existing._sum.amount ?? 0;
      if (booking.amount !== null && alreadyPaid + Number(input.amount) > booking.amount) {
        return { error: "Le paiement dépasse le solde restant.", status: 409 } as const;
      }
      const payment = await tx.bookingPayment.create({ data: {
        bookingId: id,
        amount: Number(input.amount),
        method: input.method as typeof methods[number],
        reference: typeof input.reference === "string" ? input.reference.trim() || null : null,
        recordedBy: profile.id,
      } });
      return { payment } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ ok: true, payment: result.payment }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Payment registration failed", error);
    return Response.json({ error: "Le paiement n’a pas pu être enregistré." }, { status: 503 });
  }
}
