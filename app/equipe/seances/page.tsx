import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { PortalEmpty } from "@/components/PortalStates";
import { formatStudioDate, formatStudioPhone } from "@/lib/formatters";
import { StudioCalendar } from "@/components/StudioCalendar";

export const metadata: Metadata = { title: "Mes séances" };
export const dynamic = "force-dynamic";

export default async function StaffSessionsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const { view } = await searchParams;
  if (view === "calendar") {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Abidjan" }).format(new Date());
    const end = new Date(`${today}T12:00:00Z`); end.setUTCMonth(end.getUTCMonth() + 6);
    const endDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Abidjan" }).format(end);
    const upcoming = await prisma.booking.findMany({
      where: { assignments: { some: { staffId: profile.id } }, date: { gte: today, lte: endDate }, status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] }, OR: [{ status: { not: "REQUESTED" } }, { expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      include: { service: { select: { name: true } } }, orderBy: [{ date: "asc" }, { time: "asc" }], take: 500,
    });
    return <section><header className="portal-heading"><div><div className="eyebrow"><i />Agenda équipe</div><h1>Mon calendrier.</h1></div><p>Vos séances affectées, sur les six prochains mois.</p></header><StudioCalendar initialDate={today} bookings={upcoming.map(row => ({ id: row.id, date: row.date, time: row.time, duration: row.duration, title: row.title, service: row.service.name, status: row.status, href: `/equipe/seances/${row.id}` }))} /></section>;
  }
  const sessions = await prisma.booking.findMany({
    where: { assignments: { some: { staffId: profile.id } } },
    include: { service: true },
    orderBy: [{ date: "desc" }, { time: "desc" }], take: 100,
  });
  return <section><header className="portal-heading"><div><div className="eyebrow"><i />Agenda équipe</div><h1>Mes séances.</h1></div><p>Les rendez-vous affectés à votre profil, avec le brief utile pour préparer chaque passage.</p></header>{sessions.length ? <div className="portal-rows">{sessions.map(session => <article className="portal-row" key={session.id}><div><h2>{formatStudioDate(session.date, { day: "numeric", month: "short", year: "numeric" })} · {session.time}</h2><small>{session.service.name} · {session.duration} min</small></div><p>{session.title}<small>{session.name} · {formatStudioPhone(session.phone)}</small></p><Link className="portal-action secondary" href={`/equipe/seances/${session.id}`}>Ouvrir la fiche</Link></article>)}</div> : <PortalEmpty title="Votre agenda est libre." detail="Les séances qui vous seront affectées apparaîtront dans cette liste." href="/equipe" action="Retour à aujourd’hui" />}</section>;
}
