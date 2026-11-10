"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PortalIcon } from "@/components/PortalIcon";

export type CalendarBooking = { id: string; date: string; time: string; duration: number; title: string; service: string; status: string; href: string; unassigned?: boolean; conflicts?: string[] };
type View = "month" | "week" | "day";
const fmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Abidjan", weekday: "short", day: "numeric", month: "short" });
const dateAtNoon = (value: string) => new Date(`${value}T12:00:00Z`);
const keyOf = (value: Date) => `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
const mondayIndex = (date: Date) => (date.getUTCDay() + 6) % 7;

export function StudioCalendar({ bookings, initialDate, management = false }: { bookings: CalendarBooking[]; initialDate: string; management?: boolean }) {
  const [anchor, setAnchor] = useState(dateAtNoon(initialDate));
  const [view, setView] = useState<View>("month");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const monthDays = useMemo(() => {
    const first = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1, 12));
    const start = new Date(first); start.setUTCDate(first.getUTCDate() - mondayIndex(first));
    return Array.from({ length: 42 }, (_, i) => { const date = new Date(start); date.setUTCDate(start.getUTCDate() + i); return date; });
  }, [anchor]);
  const visibleDays = view === "month" ? monthDays : (() => {
    const base = dateAtNoon(selectedDate);
    if (view === "week") base.setUTCDate(base.getUTCDate() - mondayIndex(base));
    return Array.from({ length: view === "day" ? 1 : 7 }, (_, i) => { const date = new Date(base); date.setUTCDate(base.getUTCDate() + i); return date; });
  })();
  const byDate = useMemo(() => {
    const grouped = new Map<string, CalendarBooking[]>();
    for (const booking of bookings) grouped.set(booking.date, [...(grouped.get(booking.date) ?? []), booking]);
    for (const rows of grouped.values()) rows.sort((a, b) => a.time.localeCompare(b.time));
    return grouped;
  }, [bookings]);
  const selectedBookings = byDate.get(selectedDate) ?? [];
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Africa/Abidjan" }).format(anchor);
  function move(step: number) {
    const next = new Date(anchor);
    if (view === "month") { next.setUTCDate(1); next.setUTCMonth(next.getUTCMonth() + step); }
    else next.setUTCDate(next.getUTCDate() + step * (view === "week" ? 7 : 1));
    setAnchor(next);
    setSelectedDate(keyOf(next));
  }
  return <section className="studio-calendar" aria-label="Calendrier des séances">
    <div className="calendar-toolbar"><div><p className="calendar-kicker">{management ? "Planning du studio" : "Mon agenda"}</p><h2>{label}</h2></div><div className="calendar-controls"><div className="calendar-view-switch" role="group" aria-label="Affichage du calendrier">{(["month", "week", "day"] as const).map(item => <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)}>{item === "month" ? "Mois" : item === "week" ? "Semaine" : "Jour"}</button>)}</div><button type="button" className="calendar-arrow" aria-label="Période précédente" onClick={() => move(-1)}><PortalIcon name="arrowLeft" size={17} /></button><button type="button" className="calendar-arrow" aria-label="Période suivante" onClick={() => move(1)}><PortalIcon name="arrowRight" size={17} /></button></div></div>
    {management && <p className="calendar-note">Les demandes et séances confirmées sont affichées. Les alertes signalent les horaires incohérents, les chevauchements et les séances sans affectation.</p>}
    <div className={`calendar-month-grid ${view !== "month" ? "calendar-month-grid--compact" : ""}`}>
      {view === "month" && ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(day => <div className="calendar-weekday" key={day}>{day}</div>)}
      {visibleDays.map(date => { const key = keyOf(date); const rows = byDate.get(key) ?? []; const hasConflict = management && rows.some(row => row.conflicts?.length); return <button key={key} type="button" className={`calendar-day ${date.getUTCMonth() !== anchor.getUTCMonth() && view === "month" ? "is-muted" : ""} ${selectedDate === key ? "is-selected" : ""} ${rows.length ? "has-bookings" : ""} ${hasConflict ? "has-conflict" : ""}`} aria-label={`${fmt.format(date)}, ${rows.length} séance${rows.length === 1 ? "" : "s"}${hasConflict ? ", conflit à vérifier" : ""}`} aria-pressed={selectedDate === key} onClick={() => { setSelectedDate(key); setAnchor(date); }}><span>{view === "month" ? date.getUTCDate() : fmt.format(date)}</span>{rows.length > 0 && <i aria-hidden="true" />}{hasConflict && <b aria-hidden="true"><PortalIcon name="danger" size={14} /></b>}{view === "month" && rows.length > 0 && <small>{rows.length} séance{rows.length > 1 ? "s" : ""}</small>}</button>; })}
    </div>
    <div className="calendar-agenda"><div className="calendar-agenda-title"><h3>{fmt.format(dateAtNoon(selectedDate))}</h3><span>{selectedBookings.length} séance{selectedBookings.length === 1 ? "" : "s"}</span></div>{selectedBookings.length ? <div className="calendar-events">{selectedBookings.map(booking => <article className="calendar-event" key={booking.id}><time>{booking.time}</time><div><strong>{booking.title}</strong><span>{booking.service} · {booking.duration} min</span>{management && booking.conflicts?.map(conflict => <em key={conflict}>{conflict}</em>)}</div><Link href={booking.href}>Ouvrir</Link></article>)}</div> : <p className="calendar-empty">Aucune séance prévue ce jour.</p>}</div>
  </section>;
}
