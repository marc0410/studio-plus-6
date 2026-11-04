"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PortalEmpty, PortalSkeleton } from "@/components/PortalStates";
import { PortalError } from "@/components/PortalErrorState";
import styles from "@/components/ManagerBookings.module.css";

type Booking = { id: string; title: string; date: string; time: string; duration: number; amount: number | null; amountPaid: number; remainingAmount: number | null; payments: { id: string; amount: number; method: string; paidAt: string }[]; status: string; name: string; email: string; phone: string; service: string; project: { id: string } | null };
type ApiData = { bookings: Booking[]; config: { services: { id: string; name: string }[] }; pagination?: { page: number; pages: number; total: number }; staffOptions?: { id: string; fullName: string }[] };

const money = (amount: number | null) => amount === null ? "À confirmer" : `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;

export function ManagerBookings() {
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [service, setService] = useState("");
  const [staff, setStaff] = useState("");
  const [page, setPage] = useState(1);
  const [filtersReady, setFiltersReady] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (filter !== "all") params.set("status", filter);
      if (query.trim()) params.set("q", query.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (service) params.set("service", service);
      if (staff) params.set("staff", staff);
      const response = await fetch(`/api/bookings?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chargement impossible.");
      setData(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de charger les réservations.");
    }
  }, [filter, from, page, query, service, staff, to]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedStatus = params.get("status") ?? "all";
    if (["all", "requested", "confirmed", "in_progress", "completed", "cancelled", "no_show"].includes(requestedStatus)) setFilter(requestedStatus);
    setQuery(params.get("q") ?? ""); setFrom(params.get("from") ?? ""); setTo(params.get("to") ?? "");
    setService(params.get("service") ?? ""); setStaff(params.get("staff") ?? "");
    const requestedPage = Number(params.get("page")); if (Number.isInteger(requestedPage) && requestedPage > 0) setPage(requestedPage);
    setFiltersReady(true);
  }, []);
  useEffect(() => { if (filtersReady) void load(); }, [filtersReady, load]);
  useEffect(() => {
    if (!filtersReady) return;
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (query.trim()) params.set("q", query.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (service) params.set("service", service);
    if (staff) params.set("staff", staff);
    if (page > 1) params.set("page", String(page));
    const search = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
  }, [filter, filtersReady, from, page, query, service, staff, to]);

  async function updateBooking(id: string, body: Record<string, unknown>) {
    setBusy(id); setFeedback("");
    try {
      const response = await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Modification impossible.");
      setFeedback(result.message || "Réservation mise à jour.");
      await load();
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Modification impossible.");
    } finally { setBusy(""); }
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>, bookingId: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(bookingId); setFeedback("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/payments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(form.get("amount")), method: form.get("method"), reference: form.get("reference") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Paiement impossible.");
      setFeedback("Paiement enregistré.");
      formElement.reset();
      await load();
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Paiement impossible.");
    } finally { setBusy(""); }
  }

  if (error) return <PortalError title={error} retry={() => void load()} />;
  if (!data) return <PortalSkeleton rows={5} />;

  const bookings = data.bookings;
  const pageCount = data.pagination?.pages ?? 1;
  return <section>
    <header className="portal-heading"><div><div className="eyebrow"><i />Planning & demandes</div><h1>Les réservations.</h1></div><p>Confirmez les créneaux, informez les clients et consignez les paiements reçus au studio.</p></header>
    <div className="portal-nav" aria-label="Filtrer les réservations">{[["all", "Toutes"], ["requested", "À traiter"], ["confirmed", "Confirmées"], ["in_progress", "En cours"], ["completed", "Terminées"], ["cancelled", "Annulées"], ["no_show", "Absences"]].map(([value, label]) => <button className="portal-filter" key={value} type="button" aria-pressed={filter === value} onClick={() => { setPage(1); setFilter(value); }}>{label}</button>)}</div>
    <div className="portal-nav" aria-label="Recherche avancée"><input aria-label="Recherche nom, e-mail, téléphone ou référence" placeholder="Nom, e-mail, téléphone, référence…" value={query} onChange={event => { setPage(1); setQuery(event.target.value); }} /><label>Du <input type="date" value={from} onChange={event => { setPage(1); setFrom(event.target.value); }} /></label><label>Au <input type="date" value={to} onChange={event => { setPage(1); setTo(event.target.value); }} /></label><select aria-label="Prestation" value={service} onChange={event => { setPage(1); setService(event.target.value); }}><option value="">Toutes les prestations</option>{data.config.services.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Membre affecté" value={staff} onChange={event => { setPage(1); setStaff(event.target.value); }}><option value="">Toute l’équipe</option>{(data.staffOptions ?? []).map(item => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></div>
    {data.pagination && <p className="portal-note">{data.pagination.total} réservation(s) · page {data.pagination.page} sur {data.pagination.pages}</p>}
    {feedback && <p className="portal-status" role="status">{feedback}</p>}
    {bookings.length === 0 ? <PortalEmpty title="Aucune réservation dans cette vue." detail="Les demandes reçues apparaîtront ici, avec leurs actions de gestion." href="/gestion" action="Retour au pilotage" /> : <div className="portal-rows">{bookings.map(booking => <article className="portal-booking" key={booking.id}>
      <div className="portal-booking-line"><div><span className="portal-status-pill" data-status={booking.status}>{statusLabel(booking.status)}</span><h2>{booking.title}</h2><p>{booking.service} · {booking.date} · {booking.time} · {booking.duration} min</p></div><div className="portal-booking-person"><strong>{booking.name}</strong><a href={`mailto:${booking.email}`}>{booking.email}</a><a href={`tel:${booking.phone}`}>{booking.phone}</a></div><div className="portal-booking-amount">{money(booking.amount)}<small style={{ display: "block", marginTop: 6, fontSize: 12, color: "#aaa" }}>Encaissé : {money(booking.amountPaid)}{booking.remainingAmount !== null ? ` · Solde : ${money(booking.remainingAmount)}` : ""}</small></div></div>
      {booking.status === "requested" && <div className="portal-booking-actions"><form className="portal-inline-form" onSubmit={event => { event.preventDefault(); const amount = Number(new FormData(event.currentTarget).get("amount")); void updateBooking(booking.id, { status: "confirmed", amount }); }}><label>Montant confirmé (FCFA)<input type="number" min="0" max="100000000" required name="amount" placeholder="Montant convenu" defaultValue={booking.amount ?? ""} /></label><button className="portal-action" disabled={busy === booking.id}>{busy === booking.id ? "Enregistrement…" : "Confirmer la séance"}</button></form><button className="portal-action secondary" disabled={busy === booking.id} onClick={() => void updateBooking(booking.id, { status: "cancelled" })}>Annuler</button></div>}
      <ScheduleChangeReview bookingId={booking.id} onDone={() => void load()} />
      <ManagerStatusControls bookingId={booking.id} status={booking.status} onDone={() => void load()} />
      <TeamAssignments bookingId={booking.id} />
      {booking.project && <a className="portal-action secondary" href={`/gestion/projets/${booking.project.id}`}>Ouvrir le suivi projet ↗</a>}
      {booking.status === "confirmed" && booking.remainingAmount !== 0 && <form className="portal-inline-form" onSubmit={event => void recordPayment(event, booking.id)}><label>Encaisser sur place<input type="number" min="1" max={booking.remainingAmount ?? 100000000} required name="amount" placeholder="Montant reçu" /></label><label>Moyen<select name="method"><option value="CASH">Espèces</option><option value="WAVE">Wave</option><option value="ORANGE_MONEY">Orange Money</option><option value="MTN_MOMO">MTN MoMo</option><option value="BANK_TRANSFER">Virement</option></select></label><label>Référence<input name="reference" maxLength={100} placeholder="Facultatif" /></label><button className="portal-action secondary" disabled={busy === booking.id}>{busy === booking.id ? "Enregistrement…" : "Enregistrer le paiement"}</button></form>}
      {["confirmed", "in_progress", "completed"].includes(booking.status) && <InvoiceEmailForm bookingId={booking.id} onResult={setFeedback} />}
    </article>)}</div>}
    {data.pagination && pageCount > 1 && <div className="portal-booking-actions"><button className="portal-action secondary" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}>Page précédente</button><button className="portal-action secondary" disabled={page >= pageCount} onClick={() => setPage(value => Math.min(pageCount, value + 1))}>Page suivante</button></div>}
  </section>;
}

function TeamAssignments({ bookingId }: { bookingId: string }) {
  const [staff, setStaff] = useState<{ id: string; fullName: string }[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/staff`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chargement des affectations impossible.");
      setStaff(data.staff); setAssigned(data.assignedIds);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chargement impossible."); }
  }, [bookingId]);
  useEffect(() => { void load(); }, [load]);
  async function change(staffId: string, method: "POST" | "DELETE") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/staff`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Mise à jour impossible.");
      setMessage(data.message); setSelected(""); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Mise à jour impossible."); }
    finally { setBusy(false); }
  }
  return <div className={styles.assignment}><strong>Équipe assignée</strong>{assigned.map(id => { const person = staff.find(member => member.id === id); return <p key={id}>{person?.fullName ?? "Membre"} <button type="button" disabled={busy} onClick={() => void change(id, "DELETE")}>Retirer</button></p>; })}<form onSubmit={event => { event.preventDefault(); if (selected) void change(selected, "POST"); }}><select aria-label="Choisir un membre" value={selected} onChange={event => setSelected(event.target.value)}><option value="">Ajouter un membre…</option>{staff.filter(person => !assigned.includes(person.id)).map(person => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select><button className="portal-action secondary" disabled={busy || !selected}>Affecter</button></form>{message && <p className="portal-status" role="status">{message}</p>}</div>;
}

function statusLabel(status: string) {
  return ({ requested: "À traiter", confirmed: "Confirmée", in_progress: "En cours", cancelled: "Annulée", completed: "Terminée", no_show: "Absence constatée" } as Record<string, string>)[status] ?? status;
}

function ManagerStatusControls({ bookingId, status, onDone }: { bookingId: string; status: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const options = status === "confirmed" ? [["IN_PROGRESS", "Démarrer la séance"], ["NO_SHOW", "Signaler une absence"]] : status === "in_progress" ? [["COMPLETED", "Marquer comme terminée"]] : [];
  if (!options.length) return null;
  async function setStatus(next: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Modification impossible.");
      onDone();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Modification impossible."); }
    finally { setBusy(false); }
  }
  return <div className="portal-booking-actions">{options.map(([value, label]) => <button key={value} className="portal-action secondary" disabled={busy} onClick={() => void setStatus(value)}>{busy ? "Mise à jour…" : label}</button>)}{error && <p className="portal-status" role="alert">{error}</p>}</div>;
}

function ScheduleChangeReview({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [change, setChange] = useState<{ id: string; oldDate: string; oldTime: string; newDate: string; newTime: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`/api/bookings/${bookingId}/schedule`, { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(result => {
      if (active) setChange(result?.changes?.find((item: { status: string }) => item.status === "PENDING") ?? null);
    }).catch(() => { if (active) setChange(null); });
    return () => { active = false; };
  }, [bookingId]);
  async function decide(decision: "approve" | "reject") {
    if (!change) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/schedule`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ changeId: change.id, decision }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Action impossible.");
      setChange(null); onDone();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Action impossible."); }
    finally { setBusy(false); }
  }
  if (!change) return null;
  return <div className="portal-note" style={{ marginTop: 16 }}><strong>Proposition de changement :</strong> {change.oldDate} · {change.oldTime} → {change.newDate} · {change.newTime}<div className="portal-booking-actions"><button className="portal-action" disabled={busy} onClick={() => void decide("approve")}>Accepter le nouveau créneau</button><button className="portal-action secondary" disabled={busy} onClick={() => void decide("reject")}>Refuser</button></div>{error && <p className="portal-status" role="alert">{error}</p>}</div>;
}

function InvoiceEmailForm({ bookingId, onResult }: { bookingId: string; onResult: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/invoice`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Envoi impossible.");
      onResult(result.message || "Facture envoyée.");
    } catch (error) { onResult(error instanceof Error ? error.message : "Envoi impossible."); }
    finally { setBusy(false); }
  }
  return <div className="portal-booking-actions"><button className="portal-action secondary" disabled={busy} onClick={() => void submit()}>{busy ? "Préparation et envoi du PDF…" : "Envoyer la facture PDF par e-mail"}</button></div>;
}
