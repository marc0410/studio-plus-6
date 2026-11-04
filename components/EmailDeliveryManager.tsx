"use client";

import { useCallback, useEffect, useState } from "react";
import { PortalEmpty, PortalSkeleton } from "@/components/PortalStates";
import { PortalError } from "@/components/PortalErrorState";

type Delivery = { id: string; event: string; recipient: string; providerId: string | null; status: string; error: string | null; attempts: number; createdAt: string; sentAt: string | null; canRetry: boolean };

export function EmailDeliveryManager() {
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ page: number; pages: number; total: number } | null>(null);
  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), status });
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/gestion/emails?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chargement impossible.");
      setDeliveries(data.deliveries);
      setPagination(data.pagination);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Le journal est indisponible.");
    }
  }, [page, query, status]);
  useEffect(() => { void load(); }, [load]);

  async function retry(id: string) {
    setBusy(id); setFeedback("");
    try {
      const response = await fetch("/api/gestion/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Réenvoi impossible.");
      setFeedback(data.message);
      await load();
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : "Réenvoi impossible.");
    } finally { setBusy(""); }
  }

  if (error) return <PortalError title={error} retry={() => void load()} />;
  if (deliveries === null) return <PortalSkeleton rows={4} />;

  return <section>
    <header className="portal-heading"><div><div className="eyebrow"><i />Notifications Studio+</div><h1>Les e-mails.</h1></div><p>Historique des e-mails métier et Auth. Les jetons et liens d’activation ne sont jamais affichés ni conservés pour les relances.</p></header>
    <div className="portal-nav"><input aria-label="Rechercher par destinataire ou type" placeholder="Destinataire ou type d’e-mail…" value={query} onChange={event => { setPage(1); setQuery(event.target.value); }} /><select aria-label="Statut de livraison" value={status} onChange={event => { setPage(1); setStatus(event.target.value); }}><option value="all">Tous les statuts</option><option value="SENT">Envoyés</option><option value="FAILED">Échecs</option><option value="QUEUED">En attente</option></select></div>
    {feedback && <p className="portal-status" role="status">{feedback}</p>}
    {pagination && <p className="portal-note">{pagination.total} e-mail(s) · page {pagination.page} sur {pagination.pages}</p>}
    {deliveries.length === 0 ? <PortalEmpty title="Aucun e-mail pour ces filtres." detail="Les envois apparaîtront ici après leur traitement." href="/gestion" action="Retour au pilotage" /> : <div className="portal-rows">{deliveries.map(delivery => <article className="portal-booking" key={delivery.id}>
      <div className="portal-booking-line"><div><span className="portal-status-pill" data-status={delivery.status === "SENT" ? "confirmed" : delivery.status === "FAILED" ? "cancelled" : "requested"}>{delivery.status === "SENT" ? "Envoyé" : delivery.status === "FAILED" ? "Échec d’envoi" : "En attente"}</span><h2>{delivery.event.replaceAll("_", " ").toLowerCase()}</h2><p>{new Date(delivery.sentAt ?? delivery.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })} · tentative {delivery.attempts}{delivery.providerId ? ` · Resend ${delivery.providerId}` : ""}</p></div><div className="portal-booking-person"><strong>Destinataire</strong><a href={`mailto:${delivery.recipient}`}>{delivery.recipient}</a>{delivery.error && <span>{delivery.error}</span>}</div><div>{delivery.canRetry ? <button className="portal-action" type="button" disabled={busy === delivery.id} onClick={() => void retry(delivery.id)}>{busy === delivery.id ? "Envoi…" : "Réessayer ↗"}</button> : delivery.status === "FAILED" ? <span className="portal-status-pill">Réessai indisponible</span> : null}</div></div>
    </article>)}</div>}
    {pagination && pagination.pages > 1 && <div className="portal-booking-actions"><button className="portal-action secondary" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Page précédente</button><button className="portal-action secondary" disabled={page >= pagination.pages} onClick={() => setPage(value => value + 1)}>Page suivante</button></div>}
  </section>;
}
