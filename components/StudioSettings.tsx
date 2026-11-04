"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PortalError } from "@/components/PortalErrorState";
import { PortalSkeleton } from "@/components/PortalStates";
import type { StudioConfig } from "@/lib/studio-domain";
import { trackStudioEvent } from "@/lib/analytics";

const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const hours = Array.from({ length: 49 }, (_, index) => index / 2);
const hourLabel = (hour: number) => `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 ? "30" : "00"}`;

export function StudioSettings() {
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [closedDate, setClosedDate] = useState("");

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chargement des réglages impossible.");
      setConfig({ ...data.config, closedDates: data.config.closedDates ?? [] });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Chargement impossible."); }
  }
  useEffect(() => { void load(); }, []);

  function updateService(index: number, key: "price" | "duration", value: string) {
    setConfig(current => current ? { ...current, services: current.services.map((service, item) => item !== index ? service : { ...service, [key]: key === "price" ? (value === "" ? null : Number(value)) : Number(value) }) } : current);
  }

  function toggleDay(day: number) {
    setConfig(current => current ? { ...current, closedDays: current.closedDays.includes(day) ? current.closedDays.filter(value => value !== day) : [...current.closedDays, day] } : current);
  }

  function addClosedDate() {
    if (!config || !closedDate || config.closedDates.includes(closedDate)) return;
    setConfig({ ...config, closedDates: [...config.closedDates, closedDate].sort() });
    setClosedDate("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    setBusy(true); setError(""); setFeedback("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
      trackStudioEvent("studio_settings_updated");
      setConfig(data.config); setFeedback("Les tarifs et disponibilités ont été enregistrés.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Enregistrement impossible."); }
    finally { setBusy(false); }
  }

  if (error && !config) return <PortalError title={error} retry={() => void load()} />;
  if (!config) return <PortalSkeleton rows={5} />;

  return <section><header className="portal-heading"><div><div className="eyebrow"><i />Administration</div><h1>Réglages du studio.</h1></div><p>Ces réglages alimentent le catalogue public et le calendrier de réservation.</p></header>
    {feedback && <p className="portal-status" role="status">{feedback}</p>}{error && <p className="portal-status" role="alert">{error}</p>}
    <form className="portal-surface portal-settings-form" onSubmit={save}>
      <h2>Prestations</h2><p className="portal-note">Les identités et descriptions du catalogue restent gérées dans le code pour le moment.</p>
      {config.services.map((service, index) => <fieldset key={service.id} className="portal-row"><legend>{service.name}</legend><label>Durée (minutes)<input type="number" min="30" max="240" step="30" required value={service.duration} onChange={event => updateService(index, "duration", event.target.value)} /></label><label>Tarif (FCFA)<input type="number" min="0" max="100000000" step="1" value={service.price ?? ""} placeholder="À confirmer" onChange={event => updateService(index, "price", event.target.value)} /></label></fieldset>)}
      <h2>Horaires hebdomadaires</h2><label>Ouverture<select value={config.open} onChange={event => setConfig({ ...config, open: Number(event.target.value) })}>{hours.slice(0, -1).map(hour => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}</select></label><label>Fermeture<select value={config.close} onChange={event => setConfig({ ...config, close: Number(event.target.value) })}>{hours.slice(1).map(hour => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}</select></label>
      <fieldset><legend>Jours de fermeture réguliers</legend>{days.map((day, index) => <label key={day}><input type="checkbox" checked={config.closedDays.includes(index)} onChange={() => toggleDay(index)} /> {day}</label>)}</fieldset>
      <h2>Fermetures exceptionnelles</h2><div className="portal-inline-form"><label>Date fermée<input type="date" value={closedDate} onChange={event => setClosedDate(event.target.value)} /></label><button type="button" className="portal-action secondary" disabled={!closedDate} onClick={addClosedDate}>Ajouter</button></div><ul>{config.closedDates.map(date => <li key={date}>{date} <button type="button" className="portal-action secondary" onClick={() => setConfig({ ...config, closedDates: config.closedDates.filter(item => item !== date) })}>Retirer</button></li>)}</ul>
      <button className="portal-action" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer les réglages"}</button>
    </form>
  </section>;
}
