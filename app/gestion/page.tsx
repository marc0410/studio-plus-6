import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PortalEmpty } from "@/components/PortalStates";
import { formatStudioDate } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function ManagementHomePage() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Abidjan" }).format(new Date());
  const [requested, confirmed, todayCount, paid] = await Promise.all([
    prisma.booking.count({ where: { status: "REQUESTED" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { date: today, status: { in: ["REQUESTED", "CONFIRMED"] } } }),
    prisma.bookingPayment.aggregate({ _sum: { amount: true } }),
  ]);
  const latest = await prisma.booking.findMany({
    where: { status: "REQUESTED" }, include: { service: true },
    orderBy: { createdAt: "desc" }, take: 5,
  });
  return <section>
    <header className="portal-heading"><div><div className="eyebrow"><i />Pilotage Studio+</div><h1>Le studio,<br />en mouvement.</h1></div><p>Les demandes à traiter et les séances du jour, réunies au même endroit.</p></header>
    <div className="portal-metrics"><div className="portal-metric"><span>À traiter</span><strong>{requested}</strong></div><div className="portal-metric"><span>Confirmées</span><strong>{confirmed}</strong></div><div className="portal-metric"><span>Séances aujourd’hui</span><strong>{todayCount}</strong></div><div className="portal-metric"><span>Encaissé</span><strong>{new Intl.NumberFormat("fr-FR").format(paid._sum.amount ?? 0)} <small>FCFA</small></strong></div></div>
    <div className="portal-topline"><span>Demandes récentes</span><Link href="/gestion/reservations">Toutes les réservations ↗</Link></div>
    {latest.length === 0 ? <div style={{ marginTop: 20 }}><PortalEmpty title="Aucune demande en attente." detail="Les nouvelles réservations apparaîtront ici dès leur envoi." href="/gestion/statistiques" action="Voir les statistiques" /></div> : <div className="portal-rows">{latest.map(booking => <article className="portal-row" key={booking.id}><div><h2>{booking.title}</h2><small>{booking.name} · {booking.email}</small></div><p>{booking.service.name}<small>{formatStudioDate(booking.date)} · {booking.time} · {booking.duration} min</small></p><Link className="portal-action" href={`/gestion/reservations?selected=${booking.id}`}>Traiter ↗</Link></article>)}</div>}
  </section>;
}
