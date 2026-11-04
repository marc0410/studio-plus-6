import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { createStudioInvoicePdf } from "@/lib/invoice-pdf";
import { safelySendStudioEmail } from "@/lib/email";

export const runtime = "nodejs";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== new URL(request.url).origin) return json({ error: "Origine non autorisée." }, 403);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  if (!["ADMIN", "MANAGER"].includes(profile.role)) return json({ error: "Seul le studio peut envoyer une facture." }, 403);
  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { service: true, payments: { select: { amount: true } } } });
  if (!booking) return json({ error: "Réservation introuvable." }, 404);
  if (!["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status)) return json({ error: "Confirmez d’abord la séance et son montant." }, 409);
  if (booking.amount === null) return json({ error: "Renseignez le montant convenu avant de créer la facture." }, 409);
  const amountPaid = booking.payments.reduce((sum, payment) => sum + payment.amount, 0);

  const invoice = await prisma.studioInvoice.upsert({
    where: { bookingId: id },
    create: {
      bookingId: id,
      invoiceNumber: `SP-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`,
      serviceName: booking.service.name,
      clientName: booking.name,
      amount: booking.amount,
      amountPaid,
      recipient: booking.email,
      status: "READY_TO_EMAIL",
    },
    update: {},
  });
  const pdf = await createStudioInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    clientName: invoice.clientName,
    clientEmail: invoice.recipient,
    serviceName: invoice.serviceName,
    sessionTitle: booking.title,
    sessionDate: booking.date,
    sessionTime: booking.time,
    amount: invoice.amount,
    amountPaid: invoice.amountPaid,
  });
  const sent = await safelySendStudioEmail({
    to: invoice.recipient,
    subject: `Votre facture Studio+ · ${invoice.invoiceNumber}`,
    title: "Votre facture Studio+ est jointe.",
    body: `Bonjour ${invoice.clientName}, vous trouverez en pièce jointe la facture ${invoice.invoiceNumber} pour ${invoice.serviceName}. Les règlements sur place indiqués dans le document correspondent à la date d’émission de la facture. Aucun paiement en ligne n’est demandé.`,
    event: "STUDIO_INVOICE_EMAIL",
    attachment: { filename: `facture-studio-plus-${invoice.invoiceNumber}.pdf`, content: pdf.toString("base64") },
  });
  await prisma.studioInvoice.update({ where: { id: invoice.id }, data: { status: sent ? "EMAILED" : "EMAIL_FAILED", emailedAt: sent ? new Date() : null } });
  if (!sent) return json({ error: "La facture a été préparée, mais Resend n’a pas pu l’envoyer. Vérifiez la configuration e-mail puis réessayez.", invoiceNumber: invoice.invoiceNumber }, 503);
  return json({ ok: true, message: `Facture ${invoice.invoiceNumber} envoyée en PDF à ${invoice.recipient}.` }, 201);
}
