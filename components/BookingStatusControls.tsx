"use client";

import { useState } from "react";

export function BookingStatusControls({ bookingId, status }: { bookingId: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const options = status === "CONFIRMED" ? [{ status: "IN_PROGRESS", label: "Démarrer la séance" }, { status: "NO_SHOW", label: "Signaler une absence" }] : status === "IN_PROGRESS" ? [{ status: "COMPLETED", label: "Marquer comme terminée" }] : [];
  async function update(nextStatus: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Mise à jour impossible.");
      window.location.reload();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Mise à jour impossible."); }
    finally { setBusy(false); }
  }
  if (!options.length) return null;
  return <div className="portal-booking-actions">{options.map(option => <button className="portal-action secondary" key={option.status} disabled={busy} onClick={() => void update(option.status)}>{busy ? "Mise à jour…" : option.label}</button>)}{message && <p className="portal-status" role="alert">{message}</p>}</div>;
}
