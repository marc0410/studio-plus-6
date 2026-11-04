import "server-only";
import { Resend } from "resend";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type StudioEmail = {
  to: string;
  subject: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  event: string;
  attachment?: { filename: string; content: string };
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);

async function deliver(input: StudioEmail, deliveryId: string, attempt: number) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    await prisma.emailDelivery.update({ where: { id: deliveryId }, data: { status: "FAILED", error: "RESEND_API_KEY ou EMAIL_FROM manquant." } });
    return false;
  }

  const title = escapeHtml(input.title);
  const body = escapeHtml(input.body).replace(/\n/g, "<br />");
  const action = input.actionLabel && input.actionUrl
    ? `<p style="margin:28px 0"><a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#eb0606;color:#fff;text-decoration:none">${escapeHtml(input.actionLabel)}</a></p>`
    : "";
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f3f2ef;font-family:Arial,sans-serif;color:#111"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="padding:22px 28px;background:#080808;color:#fff;font-size:18px;font-weight:bold">Studio<span style="color:#eb0606">+</span></td></tr><tr><td style="padding:34px 28px"><p style="margin:0 0 12px;color:#eb0606;font-size:11px;letter-spacing:2px;text-transform:uppercase">Votre partenaire créatif</p><h1 style="margin:0 0 16px;font-size:28px;line-height:1.15">${title}</h1><p style="font-size:15px;line-height:1.7;color:#555">${body}</p>${action}<p style="margin-top:34px;color:#777;font-size:12px">Studio+ · Cocody Angré, Abidjan</p></td></tr></table></td></tr></table></body></html>`;
  const text = `${input.title}\n\n${input.body}${input.actionUrl ? `\n\n${input.actionLabel ?? "Ouvrir"} : ${input.actionUrl}` : ""}\n\nStudio+ · Cocody Angré, Abidjan`;
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from, to: input.to, subject: input.subject, html, text, ...(input.attachment ? { attachments: [{ filename: input.attachment.filename, content: input.attachment.content }] } : {}) });
    if (error) throw new Error(error.message);
    await prisma.emailDelivery.update({ where: { id: deliveryId }, data: { status: "SENT", providerId: data?.id, sentAt: new Date(), attempts: attempt, error: null } });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Resend inconnue.";
    console.error("Transactional email failed", { event: input.event, deliveryId, message });
    await prisma.emailDelivery.update({ where: { id: deliveryId }, data: { status: "FAILED", error: message, attempts: attempt } });
    return false;
  }
}

export async function sendStudioEmail(input: StudioEmail) {
  // Invitation URLs contain one-time bearer tokens. Never persist their payload.
  const retryPayload = input.event === "PODCAST_INVITATION"
    ? undefined
    : input as unknown as Prisma.InputJsonValue;
  const delivery = await prisma.emailDelivery.create({
    data: { event: input.event, recipient: input.to, attempts: 1, ...(retryPayload ? { retryPayload } : {}) },
  });
  return deliver(input, delivery.id, 1);
}

export async function retryFailedStudioEmail(id: string) {
  const delivery = await prisma.emailDelivery.findUnique({ where: { id } });
  if (!delivery || delivery.status !== "FAILED" || !delivery.retryPayload || delivery.attempts >= 3) {
    return { ok: false, error: "Cet e-mail n’est pas relançable ou a atteint sa limite de tentatives." };
  }
  const claimed = await prisma.emailDelivery.updateMany({
    where: { id, status: "FAILED", attempts: { lt: 3 } },
    data: { status: "QUEUED", attempts: { increment: 1 }, error: null },
  });
  if (!claimed.count) return { ok: false, error: "Cet e-mail est déjà en cours de traitement." };
  const input = delivery.retryPayload as unknown as StudioEmail;
  const ok = await deliver(input, id, delivery.attempts + 1);
  if (ok && input.event === "STUDIO_INVOICE_EMAIL") {
    const invoiceNumber = input.subject.match(/SP-\d{4}-[A-F0-9]{8}/)?.[0];
    if (invoiceNumber) await prisma.studioInvoice.updateMany({ where: { invoiceNumber, recipient: input.to }, data: { status: "EMAILED", emailedAt: new Date() } });
  }
  return { ok, error: ok ? null : "Resend n’a pas pu envoyer cet e-mail. Vous pourrez réessayer." };
}

export async function safelySendStudioEmail(input: Parameters<typeof sendStudioEmail>[0]) {
  try {
    return await sendStudioEmail(input);
  } catch (error) {
    console.error("Could not record transactional email", {
      event: input.event,
      message: error instanceof Error ? error.message : "Unknown email failure",
    });
    return false;
  }
}
