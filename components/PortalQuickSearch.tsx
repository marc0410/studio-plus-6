"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { spaceOrigin } from "@/lib/hosts";
import type { AppRole } from "@/lib/roles";

type Area = "app" | "team" | "management";
type Command = { label: string; hint?: string; href: string };

export function PortalQuickSearch({ area, role }: { area: Area; role: AppRole }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [legacy, setLegacy] = useState(true);
  function openDialog() { setQuery(""); if (!dialog.current?.open) dialog.current?.showModal(); requestAnimationFrame(() => input.current?.focus()); }
  useEffect(() => {
    setLegacy(["localhost:3000", "dev.studioplusci.com"].includes(window.location.host.toLowerCase()));
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openDialog(); }
      if (event.key === "Escape" && dialog.current?.open) dialog.current.close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const prefix = area === "app" ? "/espace" : area === "team" ? "/equipe" : "/gestion";
  const path = (route: string) => legacy ? `${prefix}${route === "/" ? "" : route}` || prefix : route;
  const commands: Command[] = area === "app" ? [
    { label: "Mon espace", href: path("/") }, { label: "Réserver une séance", href: "/reserver" }, { label: "Paramètres du compte", href: path("/parametres") },
  ] : area === "team" ? [
    { label: "Aujourd’hui", href: path("/") }, { label: "Mes séances", href: path("/seances") }, { label: "Calendrier", href: `${path("/seances")}?view=calendar` },
    ...(role === "STAFF" ? [{ label: "Mes disponibilités", href: `${path("/parametres")}?section=availability#disponibilites` }] : []),
    { label: "Paramètres du compte", href: path("/parametres") },
    ...(role !== "STAFF" ? [{ label: "Ouvrir la gestion", href: legacy ? "/gestion" : `${spaceOrigin("admin")}/` }] : []),
  ] : [
    { label: "Vue d’ensemble", href: path("/") }, { label: "Réservations", href: path("/reservations") }, { label: "Calendrier", href: `${path("/reservations")}?view=calendar` },
    { label: "Statistiques", href: path("/statistiques") }, { label: "E-mails", href: path("/emails") },
    ...(role === "ADMIN" ? [{ label: "Utilisateurs", href: path("/utilisateurs") }, { label: "Réglages du studio", href: path("/reglages") }] : []),
    { label: "Espace équipe", href: legacy ? "/equipe" : `${spaceOrigin("team")}/` },
  ];
  const filtered = useMemo(() => commands.filter(item => item.label.toLocaleLowerCase("fr-FR").includes(query.trim().toLocaleLowerCase("fr-FR"))), [commands, query]);
  return <>
    <button className="portal-search-trigger" type="button" onClick={openDialog} aria-label="Rechercher une page ou une action"><span>⌕</span><span>Rechercher…</span><kbd>⌘ K</kbd></button>
    <dialog className="portal-search-dialog" ref={dialog} onClick={event => { if (event.target === dialog.current) dialog.current?.close(); }}>
      <div className="portal-search-box"><label htmlFor="portal-search-input">Rechercher une page ou une action</label><input id="portal-search-input" ref={input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Que souhaitez-vous ouvrir ?" /><div className="portal-search-results">{filtered.length ? filtered.map(command => <Link key={command.label} href={command.href} onClick={() => dialog.current?.close()}><span>{command.label}</span><small>Ouvrir ↗</small></Link>) : <p>Aucune page ou action trouvée.</p>}</div><footer><span>Tab Parcourir</span><span>Échap Fermer</span></footer></div>
    </dialog>
  </>;
}
