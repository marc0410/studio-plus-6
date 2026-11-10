"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { spaceOrigin } from "@/lib/hosts";
import { PortalIcon, type PortalIconName } from "@/components/PortalIcon";

const links = {
  app: [
    ["/espace", "Accueil"], ["/espace#seances", "Mes séances"], ["/reserver", "Réserver"], ["/espace/parametres", "Mon compte"],
  ],
  team: [
    ["/equipe", "Aujourd’hui"],
    ["/equipe/seances", "Séances"],
    ["/equipe/seances?view=calendar", "Calendrier"],
    ["/equipe/parametres", "Mon compte"],
  ],
  management: [
    ["/gestion", "Vue d’ensemble"],
    ["/gestion/reservations", "Réservations"],
    ["/gestion/reservations?view=calendar", "Calendrier"],
    ["/gestion/statistiques", "Statistiques"],
    ["/gestion/emails", "E-mails"],
  ],
} as const;

const navIcons: Record<string, PortalIconName> = {
  "Accueil": "home", "Aujourd’hui": "home", "Vue d’ensemble": "home",
  "Mes séances": "calendarTick", "Séances": "calendarTick", "Réservations": "calendarTick",
  "Calendrier": "calendar", "Disponibilités": "clock", "Mon compte": "user", "Réserver": "add",
  "Statistiques": "chart", "E-mails": "sms", "Utilisateurs": "people", "Réglages": "settings",
  "Gestion": "chart", "Espace équipe": "people",
};

export function PortalNav({ area, admin = false }: { area: "app" | "team" | "management"; admin?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [canonicalHosts, setCanonicalHosts] = useState(false);
  useEffect(() => {
    setCanonicalHosts(!["localhost:3000", "dev.studioplusci.com"].includes(window.location.host.toLowerCase()));
  }, []);
  const items = canonicalHosts
    ? area === "app"
      ? [["/", "Accueil"], ["/#seances", "Mes séances"], ["/reserver", "Réserver"], ["/parametres", "Mon compte"]] as const
      : area === "team"
      ? admin
        ? [["/", "Aujourd’hui"], ["/seances", "Séances"], ["/seances?view=calendar", "Calendrier"], ["/parametres", "Mon compte"]] as const
        : [["/", "Aujourd’hui"], ["/seances", "Séances"], ["/seances?view=calendar", "Calendrier"], ["/parametres?section=availability#disponibilites", "Disponibilités"], ["/parametres", "Mon compte"]] as const
      : [["/", "Vue d’ensemble"], ["/reservations", "Réservations"], ["/reservations?view=calendar", "Calendrier"], ["/statistiques", "Statistiques"], ["/emails", "E-mails"]] as const
    : area === "app" ? links.app : area === "team" ? (admin ? links.team : [...links.team.slice(0, 3), ["/equipe/parametres?section=availability#disponibilites", "Disponibilités"], links.team[3]] as const) : links.management;
  const extra = area === "app" ? [] : area === "team"
    ? admin ? [[canonicalHosts ? `${spaceOrigin("admin")}/` : "/gestion", "Gestion"]] as const : []
    : [...(admin ? (canonicalHosts ? [["/utilisateurs", "Utilisateurs"], ["/reglages", "Réglages"]] as const : [["/gestion/utilisateurs", "Utilisateurs"], ["/gestion/reglages", "Réglages"]] as const) : []), [canonicalHosts ? `${spaceOrigin("team")}/` : "/equipe", "Espace équipe"]] as const;
  const all = [...items, ...extra];

  return <nav className="portal-nav" aria-label={area === "app" ? "Navigation client" : area === "team" ? "Navigation équipe" : "Navigation gestion"}>
    {all.map(([href, label], index) => {
      const homePath = canonicalHosts ? "/" : area === "app" ? "/espace" : area === "team" ? "/equipe" : "/gestion";
      const targetPath = href.split(/[?#]/)[0]!;
      const isCalendarView = href.includes("view=calendar");
      const availabilitySection = href.includes("section=availability");
      const viewMatches = isCalendarView ? searchParams.get("view") === "calendar" : availabilitySection ? searchParams.get("section") === "availability" : searchParams.get("view") !== "calendar" && searchParams.get("section") !== "availability";
      const active = href === homePath || targetPath === homePath
        ? pathname === homePath || (canonicalHosts && pathname === (area === "app" ? "/espace" : area === "team" ? "/equipe" : "/gestion"))
        : isCalendarView ? pathname === targetPath && viewMatches : pathname === targetPath && viewMatches || pathname.startsWith(`${targetPath}/`);
      const key = label.toLocaleLowerCase("fr-FR").replaceAll("’", "").replaceAll(" ", "-");
      return <Link key={href} href={href} aria-label={label} title={label} data-nav-index={index} data-nav-key={key} aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined}><span className="portal-nav-icon"><PortalIcon name={navIcons[label] ?? "home"} size={19} /></span><span className="portal-nav-label">{label}</span></Link>;
    })}
  </nav>;
}
