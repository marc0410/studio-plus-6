import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validDate, DEFAULT_CONFIG, validateConfig } from "@/lib/studio-domain";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  if (!validDate(date)) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  try {
    const [row, slots] = await Promise.all([
      prisma.studioSettings.findUnique({ where: { key: "config" } }),
      prisma.bookingSlot.findMany({ where: { date, booking: { status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] }, OR: [{ status: { not: "REQUESTED" } }, { expiresAt: null }, { expiresAt: { gt: new Date() } }] } }, select: { time: true } }),
    ]);
    return NextResponse.json({ date, occupied: slots.map(slot => slot.time), config: row ? validateConfig(row.value) : DEFAULT_CONFIG }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Impossible de charger les disponibilités." }, { status: 503 });
  }
}
