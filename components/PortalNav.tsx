"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = {
  team: [
    ["/equipe", "Aujourd’hui"],
    ["/equipe/seances", "Séances"],
    ["/equipe/parametres", "Mon compte"],
  ],
  management: [
    ["/gestion", "Vue d’ensemble"],
    ["/gestion/reservations", "Réservations"],
    ["/gestion/statistiques", "Statistiques"],
    ["/gestion/emails", "E-mails"],
  ],
} as const;

export function PortalNav({ area, admin = false }: { area: "team" | "management"; admin?: boolean }) {
  const pathname = usePathname();
  const items = area === "team" ? links.team : links.management;
  const extra = area === "team"
    ? admin ? [["/gestion", "Gestion"]] as const : []
    : admin ? [["/gestion/utilisateurs", "Utilisateurs"], ["/gestion/reglages", "Réglages"]] as const : [];
  const all = [...items, ...extra];

  return <nav className="portal-nav" aria-label={area === "team" ? "Navigation équipe" : "Navigation gestion"}>
    {all.map(([href, label]) => {
      const active = href === "/equipe" || href === "/gestion"
        ? pathname === href
        : pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined}>{label}</Link>;
    })}
    {area === "management" && <Link href="/equipe">Espace équipe</Link>}
  </nav>;
}
