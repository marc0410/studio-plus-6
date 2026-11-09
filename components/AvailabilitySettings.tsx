"use client";

import { useEffect, useState, type FormEvent } from "react";

type Rule = { weekday: number; startTime: string; endTime: string };
type Exception = { date: string; isAvailable: boolean; startTime: string | null; endTime: string | null; note: string | null };
const weekdayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function AvailabilitySettings() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionAvailable, setExceptionAvailable] = useState(false);
  const [exceptionStart, setExceptionStart] = useState("09:00");
  const [exceptionEnd, setExceptionEnd] = useState("18:00");
  const [exceptionNote, setExceptionNote] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/team/availability", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Impossible de charger vos disponibilités.");
      if (alive) { setRules(result.rules); setExceptions(result.exceptions); }
    }).catch(caught => { if (alive) setError(caught instanceof Error ? caught.message : "Impossible de charger vos disponibilités."); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  function addRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startTime >= endTime) { setError("L’heure de fin doit suivre l’heure de début."); return; }
    if (rules.some(rule => rule.weekday === weekday && startTime < rule.endTime && rule.startTime < endTime)) { setError("Cette plage chevauche une disponibilité déjà indiquée."); return; }
    setError(""); setRules(current => [...current, { weekday, startTime, endTime }].sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)));
  }

  function addException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!exceptionDate || exceptions.some(item => item.date === exceptionDate)) { setError("Choisissez une date qui ne figure pas déjà dans la liste."); return; }
    if (exceptionAvailable && exceptionStart >= exceptionEnd) { setError("L’heure de fin doit suivre l’heure de début."); return; }
    setError("");
    setExceptions(current => [...current, { date: exceptionDate, isAvailable: exceptionAvailable, startTime: exceptionAvailable ? exceptionStart : null, endTime: exceptionAvailable ? exceptionEnd : null, note: exceptionNote.trim() || null }].sort((a, b) => a.date.localeCompare(b.date)));
    setExceptionDate(""); setExceptionNote("");
  }

  async function save() {
    setBusy(true); setError(""); setFeedback("");
    try {
      const response = await fetch("/api/team/availability", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules, exceptions }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible.");
      setFeedback(result.message || "Disponibilités enregistrées.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Enregistrement impossible."); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="portal-surface"><div className="portal-skeleton-stack"><div className="portal-skeleton portal-skeleton--large" /><div className="portal-skeleton portal-skeleton--wide" /></div></div>;
  return <div className="availability-editor">
    <section className="portal-surface availability-panel"><div className="availability-panel-heading"><div><h2>Horaires récurrents</h2><p>Une plage peut être ajoutée plusieurs fois pour couvrir une journée coupée.</p></div><span>{rules.length} plage{rules.length === 1 ? "" : "s"}</span></div>
      {rules.length ? <ul className="availability-list">{rules.map((rule, index) => <li key={`${rule.weekday}-${rule.startTime}-${index}`}><span>{weekdayNames[rule.weekday]}</span><strong>{rule.startTime} – {rule.endTime}</strong><button type="button" aria-label={`Retirer la plage du ${weekdayNames[rule.weekday]}`} onClick={() => setRules(current => current.filter((_, rowIndex) => rowIndex !== index))}>Retirer</button></li>)}</ul> : <p className="portal-note">Aucun horaire récurrent défini. Les disponibilités seront prises en compte après leur ajout.</p>}
      <form className="availability-add-form" onSubmit={addRule}><label>Jour<select value={weekday} onChange={event => setWeekday(Number(event.target.value))}>{weekdayNames.map((name, index) => <option key={name} value={index}>{name}</option>)}</select></label><label>Début<input type="time" step={1800} value={startTime} onChange={event => setStartTime(event.target.value)} required /></label><label>Fin<input type="time" step={1800} value={endTime} onChange={event => setEndTime(event.target.value)} required /></label><button className="portal-action secondary" type="submit">Ajouter une plage</button></form>
    </section>
    <section className="portal-surface availability-panel"><div className="availability-panel-heading"><div><h2>Exceptions</h2><p>Jusqu’à un an à l’avance : congé, fermeture personnelle ou disponibilité exceptionnelle.</p></div><span>{exceptions.length}</span></div>
      {exceptions.length ? <ul className="availability-list">{exceptions.map((item, index) => <li key={item.date}><span>{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Abidjan" }).format(new Date(`${item.date}T12:00:00Z`))}</span><strong>{item.isAvailable ? `${item.startTime} – ${item.endTime}` : "Indisponible"}{item.note ? ` · ${item.note}` : ""}</strong><button type="button" aria-label="Retirer cette exception" onClick={() => setExceptions(current => current.filter((_, rowIndex) => rowIndex !== index))}>Retirer</button></li>)}</ul> : <p className="portal-note">Aucune exception renseignée.</p>}
      <form className="availability-add-form" onSubmit={addException}><label>Date<input type="date" min={new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Abidjan" }).format(new Date())} value={exceptionDate} onChange={event => setExceptionDate(event.target.value)} required /></label><label>Type<select value={exceptionAvailable ? "available" : "unavailable"} onChange={event => setExceptionAvailable(event.target.value === "available")}><option value="unavailable">Indisponible</option><option value="available">Disponible exceptionnellement</option></select></label>{exceptionAvailable && <><label>Début<input type="time" step={1800} value={exceptionStart} onChange={event => setExceptionStart(event.target.value)} required /></label><label>Fin<input type="time" step={1800} value={exceptionEnd} onChange={event => setExceptionEnd(event.target.value)} required /></label></>}<label>Note (facultative)<input maxLength={240} value={exceptionNote} onChange={event => setExceptionNote(event.target.value)} /></label><button className="portal-action secondary" type="submit">Ajouter l’exception</button></form>
    </section>
    <div className="availability-save"><div aria-live="polite">{error && <p className="portal-status">{error}</p>}{feedback && <p className="portal-status" data-kind="success">{feedback}</p>}</div><button className="portal-action" type="button" disabled={busy} onClick={() => void save()}>{busy ? "Enregistrement…" : "Enregistrer les disponibilités"}</button></div>
  </div>;
}
