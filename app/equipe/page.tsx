import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { PortalEmpty } from "@/components/PortalStates";
import { formatStudioDate, formatStudioPhone } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function StaffHomePage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Abidjan" }).format(new Date());
  const bookings = await prisma.booking.findMany({
    where: { date: { gte: today }, status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] }, assignments: { some: { staffId: profile.id } } },
    include: { service: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 12,
  });
  return <section>
    <header className="portal-heading"><div><div className="eyebrow"><i />Espace équipe</div><h1>Bonjour {profile.fullName.split(" ")[0]}.</h1></div><p>Votre agenda et les prochaines séances qui vous sont confiées.</p></header>
    {bookings.length === 0 ? <PortalEmpty title="Rien de planifié pour le moment." detail="Les séances qui vous seront affectées apparaîtront ici." href="/" action="Retourner au site" /> : <div className="portal-rows">{bookings.map(booking => <article className="portal-row" key={booking.id}><div><h2>{booking.time} · {booking.service.name}</h2><small>{formatStudioDate(booking.date, { day: "numeric", month: "short", year: "numeric" })}</small></div><p>{booking.title}<small>{booking.name} · {formatStudioPhone(booking.phone)}</small></p><Link className="portal-action secondary" href={`/equipe/seances/${booking.id}`}>Voir la séance</Link></article>)}</div>}
  </section>;
}
