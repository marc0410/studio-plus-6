import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { hasSameOrigin } from "@/lib/request-security";
import { validDate } from "@/lib/studio-domain";

export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const timePattern = /^(?:[01]\d|2[0-3]):(?:00|30)$/;
const endTimePattern = /^(?:(?:[01]\d|2[0-3]):(?:00|30)|24:00)$/;
type RuleInput = { weekday: number; startTime: string; endTime: string };
type ExceptionInput = { date: string; isAvailable: boolean; startTime?: string | null; endTime?: string | null; note?: string | null };

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  const requestedId = new URL(request.url).searchParams.get("staffId") || profile.id;
  if (requestedId !== profile.id && !["MANAGER", "ADMIN"].includes(profile.role)) return json({ error: "Accès non autorisé." }, 403);
  try {
    const target = await prisma.profile.findUnique({ where: { id: requestedId }, select: { role: true, isActive: true } });
    if (!target || target.role !== "STAFF" || !target.isActive) return json({ error: "Membre d’équipe introuvable." }, 404);
    const [rules, exceptions] = await Promise.all([
      prisma.staffAvailabilityRule.findMany({ where: { staffId: requestedId }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
      prisma.staffAvailabilityException.findMany({ where: { staffId: requestedId }, orderBy: { date: "asc" }, take: 200 }),
    ]);
    return json({ rules, exceptions });
  } catch {
    return json({ error: "Impossible de charger les disponibilités." }, 503);
  }
}

export async function PUT(request: Request) {
  if (!hasSameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 40000) return json({ error: "La demande est trop volumineuse." }, 413);
  const profile = await getCurrentProfile();
  if (!profile) return json({ error: "Connectez-vous pour continuer." }, 401);
  if (profile.role !== "STAFF") return json({ error: "Seul un membre de l’équipe peut modifier ses disponibilités." }, 403);
  let body: { rules?: RuleInput[]; exceptions?: ExceptionInput[] };
  try { const raw = await request.text(); if (raw.length > 40000) return json({ error: "La demande est trop volumineuse." }, 413); const parsed: unknown = JSON.parse(raw); if (!parsed || typeof parsed !== "object") return json({ error: "Données invalides." }, 400); body = parsed as typeof body; } catch { return json({ error: "Données invalides." }, 400); }
  if (!Array.isArray(body.rules) || body.rules.length > 28 || !Array.isArray(body.exceptions) || body.exceptions.length > 100) return json({ error: "La liste des disponibilités est invalide." }, 400);
  const rules = body.rules;
  for (const rule of rules) {
    if (!rule || typeof rule !== "object" || !Number.isInteger(rule.weekday) || rule.weekday < 0 || rule.weekday > 6 || typeof rule.startTime !== "string" || typeof rule.endTime !== "string" || !timePattern.test(rule.startTime) || !endTimePattern.test(rule.endTime) || rule.startTime >= rule.endTime) return json({ error: "Vérifiez les jours et horaires récurrents." }, 400);
  }
  for (let i = 0; i < rules.length; i++) for (let j = i + 1; j < rules.length; j++) {
    const a = rules[i]!; const b = rules[j]!;
    if (a.weekday === b.weekday && a.startTime < b.endTime && b.startTime < a.endTime) return json({ error: "Deux plages récurrentes du même jour se chevauchent." }, 400);
  }
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Abidjan" }).format(new Date());
  const maxDate = new Date(`${today}T12:00:00Z`); maxDate.setUTCDate(maxDate.getUTCDate() + 366);
  const maxDateString = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Abidjan" }).format(maxDate);
  const seen = new Set<string>();
  for (const exception of body.exceptions) {
    if (!exception || typeof exception !== "object" || typeof exception.isAvailable !== "boolean" || !validDate(exception.date) || exception.date < today || exception.date > maxDateString || seen.has(exception.date)) return json({ error: "Une date exceptionnelle est invalide ou répétée." }, 400);
    seen.add(exception.date);
    if (exception.isAvailable) {
      if (!timePattern.test(exception.startTime ?? "") || !endTimePattern.test(exception.endTime ?? "") || exception.startTime! >= exception.endTime!) return json({ error: "Vérifiez les horaires de disponibilité exceptionnelle." }, 400);
    } else if (exception.startTime || exception.endTime) return json({ error: "Une journée d’indisponibilité ne peut pas contenir d’horaires." }, 400);
    if (exception.note != null && (typeof exception.note !== "string" || exception.note.length > 240)) return json({ error: "La note est trop longue." }, 400);
  }
  try {
    await prisma.$transaction(async tx => {
      await tx.staffAvailabilityRule.deleteMany({ where: { staffId: profile.id } });
      await tx.staffAvailabilityException.deleteMany({ where: { staffId: profile.id } });
      if (rules.length) await tx.staffAvailabilityRule.createMany({ data: rules.map(rule => ({ staffId: profile.id, weekday: rule.weekday, startTime: rule.startTime, endTime: rule.endTime, updatedAt: new Date() })) });
      if (body.exceptions!.length) await tx.staffAvailabilityException.createMany({ data: body.exceptions!.map(item => ({ staffId: profile.id, date: item.date, isAvailable: item.isAvailable, startTime: item.isAvailable ? item.startTime! : null, endTime: item.isAvailable ? item.endTime! : null, note: item.note?.trim() || null, updatedAt: new Date() })) });
    });
    return json({ ok: true, message: "Vos disponibilités ont été enregistrées." });
  } catch {
    return json({ error: "Impossible d’enregistrer vos disponibilités." }, 503);
  }
}
