"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PortalSkeleton } from "@/components/PortalStates";
import { trackStudioEvent } from "@/lib/analytics";

type Invitation = { name: string; status: string; note: string | null; bio: string | null; rundown: string | null; imageConsent: boolean; proposedDate: string | null; proposedTime: string | null; booking: { service: string; title: string; date: string; time: string } };

export function InvitationResponse({ token }: { token: string }) {
  const viewed = useRef(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [bio, setBio] = useState("");
  const [social, setSocial] = useState("");
  const [imageConsent, setImageConsent] = useState(false);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const load = useCallback(async () => {
    setError(""); setLoading(true);
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Cette invitation n’est plus disponible.");
      setInvitation(data.invitation);
      if (!viewed.current) {
        viewed.current = true;
        trackStudioEvent("guest_invitation_viewed", { status: data.invitation.status });
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Impossible de charger l’invitation."); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  async function respond(responseType: "accept" | "decline") {
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseType, note, bio, imageConsent, ...(social.trim() ? { socialLinks: { social: social.trim() } } : {}), ...(proposedDate || proposedTime ? { proposedDate, proposedTime } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Votre réponse n’a pas été enregistrée.");
      trackStudioEvent("guest_invitation_responded", { response: responseType });
      setMessage(data.message); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Votre réponse n’a pas été enregistrée."); }
    finally { setBusy(false); }
  }

  return <main className="portal-page"><div className="portal-wrap"><div className="portal-topline"><span>Studio+ / Invitation podcast</span><a href="/">Visiter Studio+</a></div><section className="invitation-card">
    <div className="eyebrow"><i />Votre présence compte</div>
    {loading ? <div style={{ marginTop: 28 }}><PortalSkeleton rows={3} /></div> : error ? <div className="portal-error" role="alert"><h1>L’invitation est inaccessible.</h1><p>{error}</p><button className="portal-action" onClick={() => void load()}>Réessayer</button></div> : invitation && <>
      <h1>Bonjour {invitation.name}.</h1><p className="invitation-intro">Vous êtes invité(e) à participer à cette séance.</p>
      <dl className="invitation-details"><div><dt>Projet</dt><dd>{invitation.booking.title}</dd></div><div><dt>Format</dt><dd>{invitation.booking.service}</dd></div><div><dt>Date</dt><dd>{invitation.booking.date} · {invitation.booking.time}</dd></div></dl>
      {invitation.rundown && <div className="invitation-details"><div><dt>Préparation</dt><dd>{invitation.rundown}</dd></div></div>}
      {invitation.status !== "invited" ? <><p className="invitation-done" role="status">{invitation.status === "accepted" ? "Votre présence est confirmée." : "Votre réponse a déjà été transmise au studio."}</p>{invitation.bio && <p>Votre bio enregistrée : {invitation.bio}</p>}{invitation.proposedDate && <p>Créneau proposé au studio : {invitation.proposedDate} · {invitation.proposedTime}</p>}{invitation.status === "accepted" && <ConsentControl token={token} consent={invitation.imageConsent} onChange={() => void load()} />}</> : <div className="portal-form">
        <label>Courte bio (facultatif)<textarea value={bio} onChange={event => setBio(event.target.value)} maxLength={500} placeholder="Quelques lignes pour vous présenter…" /></label>
        <label>Un lien social (facultatif)<input type="url" value={social} onChange={event => setSocial(event.target.value)} maxLength={300} placeholder="https://…" /></label>
        <label>Une précision pour le studio (facultatif)<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={500} placeholder="Un besoin d’accessibilité ou une question ?" /></label>
        <label>Proposer un autre créneau (facultatif)<input type="date" value={proposedDate} onChange={event => setProposedDate(event.target.value)} /></label>
        {proposedDate && <label>Heure proposée<select value={proposedTime} onChange={event => setProposedTime(event.target.value)} required><option value="">Choisir</option>{Array.from({ length: 24 }, (_, n) => n).flatMap(hour => ["00", "30"].map(minute => `${String(hour).padStart(2, "0")}:${minute}`)).map(time => <option key={time}>{time}</option>)}</select></label>}
        <label className="invitation-consent"><input type="checkbox" checked={imageConsent} onChange={event => setImageConsent(event.target.checked)} />J’autorise Studio+ à utiliser mon image et ma voix pour la communication liée à cette séance. (Facultatif)</label>
        <div className="invitation-actions"><button className="portal-action" type="button" disabled={busy || (!!proposedDate !== !!proposedTime)} onClick={() => void respond("accept")}>Accepter l’invitation</button><button className="portal-action secondary" type="button" disabled={busy} onClick={() => void respond("decline")}>Décliner</button></div>
      </div>}
      {message && <p className="invitation-done" role="status">{message}</p>}{error && <p className="portal-status" role="alert">{error}</p>}
    </>}
  </section></div></main>;
}

function ConsentControl({ token, consent, onChange }: { token: string; consent: boolean; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function update(imageConsent: boolean) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageConsent }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Mise à jour impossible.");
      setMessage(data.message); onChange();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Mise à jour impossible."); }
    finally { setBusy(false); }
  }
  return <div className="portal-consent-control"><p>Consentement image et voix : <strong>{consent ? "accord donné" : "non donné"}</strong>.</p><button className="portal-action secondary" type="button" disabled={busy} onClick={() => void update(!consent)}>{consent ? "Retirer mon consentement" : "Donner mon consentement"}</button>{message && <p role="status">{message}</p>}</div>;
}
