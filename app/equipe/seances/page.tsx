import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { PortalEmpty } from "@/components/PortalStates";

export const metadata: Metadata = { title: "Mes séances" };
export const dynamic = "force-dynamic";

export default async function StaffSessionsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const sessions = await prisma.booking.findMany({
    where: { assignments: { some: { staffId: profile.id } } },
    include: { service: true },
    orderBy: [{ date: "desc" }, { time: "desc" }], take: 100,
  });
  return <section><header className="portal-heading"><div><div className="eyebrow"><i />Agenda équipe</div><h1>Mes séances.</h1></div><p>Les rendez-vous affectés à votre profil, avec le brief utile pour préparer chaque passage.</p></header>{sessions.length ? <div className="portal-rows">{sessions.map(session => <article className="portal-row" key={session.id}><div><h2>{session.date} · {session.time}</h2><small>{session.service.name} · {session.duration} min</small></div><p>{session.title}<small>{session.name} · {session.phone}</small></p><Link className="portal-action secondary" href={`/equipe/seances/${session.id}`}>Ouvrir la fiche</Link></article>)}</div> : <PortalEmpty title="Votre agenda est libre." detail="Les séances qui vous seront affectées apparaîtront dans cette liste." href="/equipe" action="Retour à aujourd’hui" />}</section>;
}
