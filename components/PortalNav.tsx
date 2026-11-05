"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { spaceOrigin } from "@/lib/hosts";

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
  const [canonicalHosts, setCanonicalHosts] = useState(false);
  useEffect(() => {
    setCanonicalHosts(!["localhost:3000", "dev.studioplusci.com"].includes(window.location.host.toLowerCase()));
  }, []);
  const items = canonicalHosts
    ? area === "team"
      ? [["/", "Aujourd’hui"], ["/seances", "Séances"], ["/parametres", "Mon compte"]] as const
      : [["/", "Vue d’ensemble"], ["/reservations", "Réservations"], ["/statistiques", "Statistiques"], ["/emails", "E-mails"]] as const
    : area === "team" ? links.team : links.management;
  const extra = area === "team"
    ? admin ? [[canonicalHosts ? `${spaceOrigin("admin")}/` : "/gestion", "Gestion"]] as const : []
    : admin ? (canonicalHosts ? [["/utilisateurs", "Utilisateurs"], ["/reglages", "Réglages"]] as const : [["/gestion/utilisateurs", "Utilisateurs"], ["/gestion/reglages", "Réglages"]] as const) : [];
  const all = [...items, ...extra];

  return <nav className="portal-nav" aria-label={area === "team" ? "Navigation équipe" : "Navigation gestion"}>
    {all.map(([href, label]) => {
      const homePath = canonicalHosts ? "/" : area === "team" ? "/equipe" : "/gestion";
      const active = href === homePath
        ? pathname === homePath || (canonicalHosts && pathname === (area === "team" ? "/equipe" : "/gestion"))
        : pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined}>{label}</Link>;
    })}
    {area === "management" && <Link href={canonicalHosts ? `${spaceOrigin("team")}/` : "/equipe"}>Espace équipe</Link>}
  </nav>;
}
