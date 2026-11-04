import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PortalEmpty } from "@/components/PortalStates";

export const metadata: Metadata = { title: "Statistiques du studio" };
export const dynamic = "force-dynamic";

export default async function ManagementStatsPage({ searchParams }: { searchParams: Promise<{ mois?: string }> }) {
  const params = await searchParams;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.mois ?? "") ? params.mois! : currentMonth;
  const from = `${month}-01`;
  const toDate = new Date(`${from}T12:00:00Z`); toDate.setUTCMonth(toDate.getUTCMonth() + 1);
  const to = toDate.toISOString().slice(0, 10);
  const [total, requested, confirmed, inProgress, completed, cancelled, noShow, payments, grouped, services, clients] = await Promise.all([
    prisma.booking.count({ where: { date: { gte: from, lt: to } } }),
    prisma.booking.count({ where: { date: { gte: from, lt: to }, status: "REQUESTED" } }),
    prisma.booking.count({ where: { date: { gte: from, lt: to }, status: "CONFIRMED" } }),
    prisma.booking.count({ where: { date: { gte: from, lt: to }, status: "IN_PROGRESS" } }),
    prisma.booking.count({ where: { date: { gte: from, lt: to }, status: "COMPLETED" } }),
    prisma.booking.count({ where: { date: { gte: from, lt: to }, status: "CANCELLED" } }),
    prisma.booking.count({ where: { date: { gte: from, lt: to }, status: "NO_SHOW" } }),
    prisma.bookingPayment.aggregate({ where: { paidAt: { gte: new Date(`${from}T00:00:00Z`), lt: toDate } }, _sum: { amount: true } }),
    prisma.booking.groupBy({ by: ["serviceId"], where: { date: { gte: from, lt: to } }, _count: { _all: true } }),
    prisma.service.findMany({ select: { id: true, name: true } }),
    prisma.booking.findMany({ where: { date: { gte: from, lt: to }, status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] } }, select: { ownerId: true } }),
  ]);
  const serviceName = new Map(services.map(service => [service.id, service.name]));
  const uniqueClients = new Set(clients.map(booking => booking.ownerId)).size;
  const displayDate = new Date(`${month}-15T12:00:00Z`);
  return <section>
    <header className="portal-heading"><div><div className="eyebrow"><i />Indicateurs · {new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(displayDate)}</div><h1>Lire l’activité.</h1></div><p>Encaissé = paiements saisis pendant le mois. Clients actifs = clients avec séance confirmée, en cours ou terminée sur la période.</p></header>
    <form className="portal-nav" action="/gestion/statistiques"><label>Mois analysé <input type="month" name="mois" defaultValue={month} /></label><button className="portal-action secondary">Afficher</button></form>
    <div className="portal-metrics"><div className="portal-metric"><span>Demandes</span><strong>{total}</strong></div><div className="portal-metric"><span>À traiter</span><strong>{requested}</strong></div><div className="portal-metric"><span>Confirmées</span><strong>{confirmed}</strong></div><div className="portal-metric"><span>En cours</span><strong>{inProgress}</strong></div><div className="portal-metric"><span>Terminées</span><strong>{completed}</strong></div><div className="portal-metric"><span>Annulées</span><strong>{cancelled}</strong></div><div className="portal-metric"><span>Absences</span><strong>{noShow}</strong></div><div className="portal-metric"><span>Encaissé pendant le mois</span><strong>{new Intl.NumberFormat("fr-FR").format(payments._sum.amount ?? 0)} <small>FCFA</small></strong></div><div className="portal-metric"><span>Clients actifs¹</span><strong>{uniqueClients}</strong></div></div>
    <div className="portal-topline"><span>Demandes par prestation</span><span>{month}</span></div>
    {grouped.length === 0 ? <div style={{ marginTop: 20 }}><PortalEmpty title="Pas encore de données pour ce mois." detail="Les chiffres apparaîtront dès que les premières demandes seront reçues." href="/gestion/reservations" action="Voir les réservations" /></div> : <div className="portal-rows">{grouped.map(item => <article className="portal-row" key={item.serviceId}><h2>{serviceName.get(item.serviceId) ?? item.serviceId}</h2><p>{item._count._all} demande{item._count._all > 1 ? "s" : ""}</p><span className="portal-status-pill">{total ? Math.round(item._count._all / total * 100) : 0}%</span></article>)}</div>}
  </section>;
}
