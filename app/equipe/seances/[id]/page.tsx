import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/current-profile";
import { BookingStatusControls } from "@/components/BookingStatusControls";
import { formatStudioDate, formatStudioPhone } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function StaffSessionDetail({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const { id } = await params;
  const booking = await prisma.booking.findFirst({
    where: { id, assignments: { some: { staffId: profile.id } } },
    include: { service: true, participants: true, project: { select: { id: true } } },
  });
  if (!booking) notFound();
  return <section><header className="portal-heading"><div><div className="eyebrow"><i />Fiche séance</div><h1>{booking.title}</h1></div><p>{booking.service.name} · {formatStudioDate(booking.date)} à {booking.time} · {booking.duration} min</p></header><div className="portal-surface"><div className="portal-rows"><article className="portal-row"><h2>Contact client</h2><p>{booking.name}<small><a href={`mailto:${booking.email}`}>{booking.email}</a><br /><a href={`tel:${booking.phone}`}>{formatStudioPhone(booking.phone)}</a></small></p></article><article className="portal-row"><h2>Brief</h2><p>{booking.notes || "Aucune note transmise."}</p></article><article className="portal-row"><h2>État</h2><p>{booking.status === "REQUESTED" ? "À confirmer" : booking.status === "CONFIRMED" ? "Confirmée" : booking.status === "IN_PROGRESS" ? "En cours" : booking.status === "NO_SHOW" ? "Absence constatée" : booking.status === "CANCELLED" ? "Annulée" : "Terminée"}</p></article></div><BookingStatusControls bookingId={booking.id} status={booking.status} />{booking.project && <Link className="portal-action secondary" style={{ marginTop: 25 }} href={`/equipe/projets/${booking.project.id}`}>Ouvrir le projet ↗</Link>}<h2 style={{ marginTop: 28, fontSize: 21 }}>Participants</h2>{booking.participants.length ? booking.participants.map(person => <p className="portal-note" key={person.id}>{person.name} · {person.role}</p>) : <p className="portal-note">Aucun participant ajouté pour le moment.</p>}<Link className="portal-action secondary" style={{ marginTop: 25 }} href="/equipe/seances">← Retour aux séances</Link></div></section>;
}
