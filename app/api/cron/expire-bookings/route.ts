import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expirePendingBookings } from "@/lib/booking-expiration";
import { safelySendStudioEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const now = new Date();
    const candidates = await prisma.booking.findMany({ where: { status: "REQUESTED", expiresAt: { lte: now } }, select: { id: true, email: true, name: true, date: true, time: true, service: { select: { name: true } } }, take: 500 });
    const expiredIds = await expirePendingBookings(now);
    const expired = candidates.filter(booking => expiredIds.includes(booking.id));
    const origin = process.env.APP_URL ?? new URL(request.url).origin;
    await Promise.all(expired.map(booking => safelySendStudioEmail({ to: booking.email, subject: "Votre demande de séance a expiré", title: "Le créneau a été libéré.", body: `Bonjour ${booking.name}, votre demande ${booking.service.name} du ${booking.date} à ${booking.time} a expiré sans confirmation. Vous pouvez envoyer une nouvelle demande.`, actionLabel: "Faire une nouvelle demande", actionUrl: `${origin}/reserver`, event: "BOOKING_REQUEST_EXPIRED" })));
    return NextResponse.json({ ok: true, expired: expired.length });
  } catch (error) { console.error("Booking expiration cron failed", error); return NextResponse.json({ error: "Expiration impossible." }, { status: 503 }); }
}
