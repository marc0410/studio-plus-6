import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return Response.json({ error: "Connectez-vous pour continuer." }, { status: 401 });
  if (!["ADMIN", "MANAGER"].includes(profile.role)) return Response.json({ error: "Statistiques réservées à l’équipe de gestion." }, { status: 403 });
  try {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return Response.json({ error: "Période invalide." }, { status: 400 });
    const from = `${month}-01`;
    const nextMonth = new Date(`${from}T12:00:00Z`);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    const to = nextMonth.toISOString().slice(0, 10);
    const where = { date: { gte: from, lt: to } };
    const [total, requested, confirmed, cancelled, payments, grouped, services] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: "REQUESTED" } }),
      prisma.booking.count({ where: { ...where, status: "CONFIRMED" } }),
      prisma.booking.count({ where: { ...where, status: "CANCELLED" } }),
      prisma.bookingPayment.aggregate({ where: { paidAt: { gte: new Date(`${from}T00:00:00Z`), lt: nextMonth } }, _sum: { amount: true } }),
      prisma.booking.groupBy({ by: ["serviceId"], where, _count: { _all: true } }),
      prisma.service.findMany({ select: { id: true, name: true } }),
    ]);
    const serviceNames = new Map(services.map(service => [service.id, service.name]));
    return Response.json({ month, total, requested, confirmed, cancelled, collected: payments._sum.amount ?? 0, byService: grouped.map(item => ({ service: serviceNames.get(item.serviceId) ?? item.serviceId, count: item._count._all })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Booking stats failed", error);
    return Response.json({ error: "Les statistiques sont momentanément indisponibles." }, { status: 503 });
  }
}
