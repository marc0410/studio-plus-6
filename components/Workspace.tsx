"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Ink } from "@/components/handwriting/Ink";
import { PortalError } from "@/components/PortalErrorState";
import { PortalSkeleton } from "@/components/PortalStates";
import styles from "@/components/Workspace.module.css";
import { trackStudioEvent } from "@/lib/analytics";

type Participant = { id: string; name: string; email: string; role: string };
type Payment = { id: string; amount: number; method: string; paidAt: string };
type Booking = {
  id: string; service: string; title: string; date: string; time: string;
  duration: number; amount: number | null; amountPaid: number;
  remainingAmount: number | null; payments: Payment[];
  status: "requested" | "confirmed" | "in_progress" | "cancelled" | "completed" | "no_show";
  name: string; email: string; phone: string; notes: string;
  canManage: boolean; participants: Participant[];
  project: { id: string } | null;
  scheduleChanges: { id: string; oldDate: string; oldTime: string; newDate: string; newTime: string; status: string; createdAt: string }[];
};
type Bootstrap = {
  me: null | { name: string; email: string; role: string };
  bookings: Booking[];
  config: { services: { id: string; name: string }[] };
};

const money = (value: number | null) => value === null ? "À confirmer" : `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
const paymentNames: Record<string, string> = { CASH: "Espèces", WAVE: "Wave", ORANGE_MONEY: "Orange Money", MTN_MOMO: "MTN MoMo", BANK_TRANSFER: "Virement", OTHER: "Autre" };
const statusNames: Record<Booking["status"], string> = { requested: "En attente de confirmation", confirmed: "Confirmée", in_progress: "En cours", cancelled: "Annulée", completed: "Terminée", no_show: "Absence constatée" };

export function Workspace() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/bookings", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Impossible de charger votre espace.");
      setData(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de charger votre espace.");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function mutate(body: Record<string, unknown>, method = "POST") {
    const bookingMutation = body.action === "booking" && typeof body.id === "string";
    const invitationMutation = body.action === "participant" && typeof body.bookingId === "string";
    if (!bookingMutation && !invitationMutation) return;
    setBusy(true); setFeedback("");
    try {
      const endpoint = bookingMutation ? `/api/bookings/${body.id}` : `/api/bookings/${body.bookingId}/invitations`;
      const payload = bookingMutation ? { status: body.status } : method === "DELETE" ? { participantId: body.id } : { name: body.name, email: body.email, role: body.role };
      const response = await fetch(endpoint, { method: bookingMutation ? "PATCH" : method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "La modification a échoué.");
      if (bookingMutation && body.status === "cancelled") trackStudioEvent("booking_cancelled_by_client");
      if (invitationMutation) trackStudioEvent(method === "DELETE" ? "booking_participant_removed" : "booking_participant_invited", { role: String(body.role ?? "participant") });
      await load();
      setFeedback(result.message || "Modifications enregistrées.");
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "La modification a échoué.");
    } finally { setBusy(false); }
  }

  if (!data) return error
    ? <PortalError title={error} retry={() => void load()} />
    : <main className="workspace-page"><div className="workspace-grid"><section className="workspace-main"><div className="eyebrow"><i />Mon espace créatif</div><h1>Préparons votre espace.</h1><PortalSkeleton rows={4} /></section></div></main>;

  if (!data.me) return <main className="workspace-page"><div className="workspace-grid"><section className="workspace-card"><div className="eyebrow"><i />Mon espace créatif</div><h1>Presque au <Ink type="underline" trigger="enter" color="accent">studio.</Ink></h1><p>Connectez-vous pour retrouver vos réservations, vos participants et vos séances.</p><Link className="button" href={`/connexion?return_to=${encodeURIComponent("/espace")}`}>Se connecter ↗</Link></section></div></main>;

  const bookings = data.bookings;
  const selected = bookings.find(booking => booking.id === selectedId);
  const upcoming = bookings.filter(booking => !["cancelled", "completed", "no_show"].includes(booking.status) && booking.date >= new Date().toISOString().slice(0, 10));
  const serviceName = (id: string) => data.config.services.find(service => service.id === id)?.name ?? id;

  return <main id="contenu" className="workspace-page"><div className="workspace-grid">
    <nav className="workspace-nav" aria-label="Navigation espace client"><Link href="/">← Retour au site</Link><a href="#seances">Mes séances</a><Link href="/reserver">Réserver une séance</Link><Link href="/espace/parametres">Mon compte</Link><Link href="/deconnexion">Se déconnecter</Link></nav>
    <section className="workspace-main">
      <div className="eyebrow"><i />Mon espace créatif</div>
      <h1>Bonjour <Ink type="underline" trigger="enter" color="accent">{data.me.name.split(" ")[0]}.</Ink></h1>
      <p className="workspace-intro">Retrouvez vos séances, leur statut et le suivi de vos paiements sur place.</p>
      {feedback && <p className="status" role="status">{feedback}</p>}
      <div className="stat-grid"><div className="stat">Séances à venir<strong>{upcoming.length}</strong></div><div className="stat">À confirmer<strong>{bookings.filter(booking => booking.status === "requested").length}</strong></div><div className="stat">Participants<strong>{bookings.reduce((total, booking) => total + booking.participants.length, 0)}</strong></div></div>
      <div id="seances" className="workspace-section-heading"><h2>Vos séances</h2><Link className="button" href="/reserver">Nouvelle séance ↗</Link></div>
      {bookings.length === 0 ? <section className="workspace-card"><p>Aucune séance pour le moment. Votre prochaine idée peut commencer ici.</p><Link href="/reserver" className="button">Réserver le studio ↗</Link></section> : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Projet</th><th>Créneau</th><th>Prestation</th><th>Montant</th><th>État</th></tr></thead><tbody>{bookings.map(booking => <tr key={booking.id} aria-selected={selectedId === booking.id}>
        <td><button className="table-row-button" type="button" onClick={() => setSelectedId(selectedId === booking.id ? "" : booking.id)} aria-expanded={selectedId === booking.id}>{booking.title}</button></td>
        <td>{formatDate(booking.date)}<small>{booking.time} · {booking.duration} min</small></td>
        <td>{serviceName(booking.service)}</td><td>{money(booking.amount)}<small>Payé : {money(booking.amountPaid)}</small></td><td>{statusNames[booking.status]}</td>
      </tr>)}</tbody></table></div>}
      {selected && <section className="workspace-card workspace-booking-detail" aria-live="polite">
        <div className="workspace-section-heading"><div><span className="portal-status-pill" data-status={selected.status}>{statusNames[selected.status]}</span><h2>{selected.title}</h2></div><button type="button" aria-label="Fermer le détail" onClick={() => setSelectedId("")}>×</button></div>
        <p>{serviceName(selected.service)} · {formatDate(selected.date)} · {selected.time} · {selected.duration} min</p>
        {selected.notes && <p className="workspace-note">{selected.notes}</p>}
        {selected.project && <p><Link className="button ghost" href={`/espace/projets/${selected.project.id}`}>Suivre mon projet ↗</Link></p>}
        {selected.status === "confirmed" && <RescheduleRequest booking={selected} onDone={() => void load()} />}
        {selected.scheduleChanges.length > 0 && <div className="payment-history"><h3>Historique des changements de créneau</h3>{selected.scheduleChanges.map(change => <p key={change.id}>{change.oldDate} · {change.oldTime} → {change.newDate} · {change.newTime} · {change.status === "PENDING" ? "En attente du studio" : change.status === "APPROVED" ? "Accepté" : "Refusé"}</p>)}</div>}
        <div className="payment-summary"><div><span>Montant convenu</span><strong>{money(selected.amount)}</strong></div><div><span>Déjà réglé sur place</span><strong>{money(selected.amountPaid)}</strong></div><div><span>Solde restant</span><strong>{money(selected.remainingAmount)}</strong></div></div>
        {selected.payments.length > 0 && <div className="payment-history"><h3>Paiements enregistrés</h3>{selected.payments.map(payment => <p key={payment.id}>{money(payment.amount)} · {paymentNames[payment.method] ?? payment.method} · {new Date(payment.paidAt).toLocaleDateString("fr-FR")}</p>)}</div>}
        <h3>Participants · {selected.participants.length}</h3>
        <InvitationProfiles bookingId={selected.id} />
        {selected.participants.length === 0 ? <p>Aucun participant invité pour le moment.</p> : selected.participants.map(person => <p className="workspace-participant" key={person.id}>{person.name} · {person.email} · {person.role}<button type="button" disabled={busy} onClick={() => void mutate({ action: "participant", id: person.id, bookingId: selected.id }, "DELETE")}>Retirer</button></p>)}
        {selected.status !== "cancelled" && selected.status !== "completed" && <ParticipantForm onSubmit={person => void mutate({ action: "participant", bookingId: selected.id, ...person })} />}
        <div className="workspace-detail-actions"><button className="button ghost" type="button" onClick={() => downloadCalendar(selected, serviceName(selected.service))}>Télécharger l’invitation .ics</button>{!["cancelled", "completed", "no_show"].includes(selected.status) && <button className="button ghost" type="button" disabled={busy} onClick={() => void mutate({ action: "booking", id: selected.id, status: "cancelled" }, "PATCH")}>Annuler la séance</button>}</div>
      </section>}
    </section>
  </div></main>;
}

function RescheduleRequest({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/bookings/${booking.id}/schedule`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, time }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Proposition impossible.");
      trackStudioEvent("booking_reschedule_requested");
      setMessage(data.message); onDone();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Proposition impossible."); }
    finally { setBusy(false); }
  }
  const pending = booking.scheduleChanges.some(change => change.status === "PENDING");
  return <form className={styles.reschedule} onSubmit={submit}><h3>Demander un changement de créneau</h3><div><label>Nouvelle date<input type="date" min={new Date().toISOString().slice(0, 10)} max={new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)} value={date} onChange={event => setDate(event.target.value)} required /></label><label>Nouvelle heure<input type="time" step={1800} value={time} onChange={event => setTime(event.target.value)} required /></label></div><button className="button ghost" disabled={busy || pending}>{pending ? "Proposition déjà en attente" : busy ? "Envoi…" : "Proposer ce créneau"}</button>{message && <p role="status">{message}</p>}</form>;
}

function InvitationProfiles({ bookingId }: { bookingId: string }) {
  const [invitations, setInvitations] = useState<{ name: string; status: string; bio: string | null; socialLinks: Record<string, string> | null; imageConsent: boolean; proposedDate: string | null; proposedTime: string | null }[]>([]);
  useEffect(() => {
    let active = true;
    fetch(`/api/bookings/${bookingId}/invitations`, { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(data => { if (active) setInvitations(data?.invitations ?? []); }).catch(() => { if (active) setInvitations([]); });
    return () => { active = false; };
  }, [bookingId]);
  if (!invitations.length) return null;
  return <div className="payment-history"><h3>Réponses des invités</h3>{invitations.map((guest, index) => <article className="workspace-invitation" key={`${guest.name}-${index}`}><strong>{guest.name} · {guest.status === "accepted" ? "Présence confirmée" : guest.status === "declined" ? "A décliné" : "En attente"}</strong>{guest.bio && <p>{guest.bio}</p>}{guest.socialLinks && Object.values(guest.socialLinks).map(link => <a key={link} href={link} target="_blank" rel="noreferrer">Profil social ↗</a>)}{guest.imageConsent && <small>Consentement image/voix enregistré</small>}{guest.proposedDate && <small>Créneau proposé : {guest.proposedDate} · {guest.proposedTime}</small>}</article>)}</div>;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Abidjan" });
}

function downloadCalendar(booking: Booking, service: string) {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const start = Date.parse(`${booking.date}T${booking.time}:00Z`);
  const stamp = (value: number) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Studio Plus//Calendrier//FR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${booking.id}@studio-plus`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(start + booking.duration * 60000)}`, `SUMMARY:${escape(booking.title)}`, "LOCATION:Studio Plus, Cocody Angré", `DESCRIPTION:${escape(`${service} · ${booking.notes || ""}`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n") + "\r\n";
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([lines], { type: "text/calendar" }));
  anchor.download = `studio-plus-${booking.date}.ics`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 3000);
}

function ParticipantForm({ onSubmit }: { onSubmit: (participant: { name: string; email: string; role: string }) => void }) {
  const [open, setOpen] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({ name: String(form.get("name")), email: String(form.get("email")), role: String(form.get("role")) });
    event.currentTarget.reset();
    setOpen(false);
  }
  return <div className="workspace-participant-form">{open ? <form className="form-grid" onSubmit={submit}><label>Nom<input name="name" required minLength={2} maxLength={100} /></label><label>E-mail<input name="email" type="email" required maxLength={180} /></label><label>Rôle<select name="role"><option>Invité</option><option>Co-intervenant</option><option>Technicien</option></select></label><button className="button">Ajouter l’invité ↗</button><button className="button ghost" type="button" onClick={() => setOpen(false)}>Annuler</button></form> : <button className="button ghost" type="button" onClick={() => setOpen(true)}>+ Ajouter un participant</button>}</div>;
}
