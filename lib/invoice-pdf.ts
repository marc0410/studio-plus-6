import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Standard PDF Helvetica uses WinAnsi; narrow no-break spaces and arbitrary
// Unicode in user-provided names would otherwise make pdf-lib throw.
const pdfText = (value: string) => value.normalize("NFC")
  .replace(/[\u00a0\u202f]/g, " ")
  .replace(/[\u2010-\u2015]/g, "-")
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[^\x20-\x7E\xA1-\xFF]/g, "?");
const money = (amount: number) => pdfText(`${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`);
const dateFr = (value: Date | string) => new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", timeZone: "Africa/Abidjan" });

export async function createStudioInvoicePdf(input: {
  invoiceNumber: string; issuedAt: Date; clientName: string; clientEmail: string;
  serviceName: string; sessionTitle: string; sessionDate: string; sessionTime: string;
  amount: number; amountPaid: number;
}) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Facture ${input.invoiceNumber} — Studio+`);
  pdf.setAuthor("Studio+");
  pdf.setSubject("Facture de prestation Studio+");
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0.035, 0.035, 0.035);
  const muted = rgb(0.38, 0.38, 0.38);
  const red = rgb(0.92, 0.02, 0.02);
  page.drawRectangle({ x: 0, y: height - 160, width, height: 160, color: black });
  page.drawRectangle({ x: 0, y: height - 166, width, height: 6, color: red });
  try {
    const logoBytes = await readFile(join(process.cwd(), "public/studio/assets/logo-light.png"));
    const logo = await pdf.embedPng(logoBytes);
    const size = logo.scale(Math.min(190 / logo.width, 62 / logo.height));
    page.drawImage(logo, { x: 48, y: height - 100, width: size.width, height: size.height });
  } catch {
    page.drawText("Studio+", { x: 48, y: height - 84, size: 30, font: bold, color: rgb(1, 1, 1) });
  }
  page.drawText("Cocody Angré · Abidjan", { x: 48, y: height - 128, size: 10, font: regular, color: rgb(0.78, 0.78, 0.78) });
  page.drawText("FACTURE", { x: 48, y: height - 226, size: 30, font: bold, color: black });
  page.drawText(`N° ${input.invoiceNumber}`, { x: 48, y: height - 251, size: 11, font: regular, color: muted });
  page.drawText(`Émise le ${dateFr(input.issuedAt)}`, { x: 48, y: height - 271, size: 11, font: regular, color: muted });
  page.drawText("FACTURÉ À", { x: 48, y: height - 330, size: 9, font: bold, color: red });
  page.drawText(pdfText(input.clientName), { x: 48, y: height - 354, size: 14, font: bold, color: black });
  page.drawText(pdfText(input.clientEmail), { x: 48, y: height - 374, size: 11, font: regular, color: muted });
  const tableTop = height - 430;
  page.drawRectangle({ x: 40, y: tableTop - 44, width: width - 80, height: 44, color: rgb(0.95, 0.95, 0.95) });
  page.drawText("PRESTATION", { x: 54, y: tableTop - 27, size: 9, font: bold, color: muted });
  page.drawText("MONTANT", { x: width - 150, y: tableTop - 27, size: 9, font: bold, color: muted });
  page.drawText(pdfText(input.serviceName), { x: 54, y: tableTop - 73, size: 13, font: bold, color: black });
  page.drawText(pdfText(input.sessionTitle.slice(0, 70)), { x: 54, y: tableTop - 94, size: 10, font: regular, color: muted });
  page.drawText(`${dateFr(`${input.sessionDate}T12:00:00Z`)} · ${input.sessionTime}`, { x: 54, y: tableTop - 112, size: 10, font: regular, color: muted });
  page.drawText(money(input.amount), { x: width - 150, y: tableTop - 75, size: 12, font: bold, color: black });
  page.drawLine({ start: { x: 48, y: tableTop - 137 }, end: { x: width - 48, y: tableTop - 137 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  page.drawText("Total convenu", { x: width - 210, y: tableTop - 169, size: 11, font: regular, color: muted });
  page.drawText(money(input.amount), { x: width - 150, y: tableTop - 194, size: 18, font: bold, color: red });
  page.drawText(`Paiements reçus sur place : ${money(input.amountPaid)}`, { x: width - 260, y: tableTop - 224, size: 10, font: regular, color: muted });
  page.drawText(`Solde : ${money(Math.max(0, input.amount - input.amountPaid))}`, { x: width - 260, y: tableTop - 242, size: 10, font: bold, color: black });
  page.drawRectangle({ x: 40, y: 70, width: width - 80, height: 1, color: rgb(0.88, 0.88, 0.88) });
  page.drawText("Merci d’avoir choisi Studio+.", { x: 48, y: 48, size: 10, font: bold, color: black });
  page.drawText("Document commercial Studio+ · Paiement effectué sur place, le cas échéant.", { x: 48, y: 31, size: 8, font: regular, color: muted });
  return Buffer.from(await pdf.save());
}
