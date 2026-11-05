import type { StudioSpace } from "./hosts.ts";

export type HostRoute =
  | { type: "pass" }
  | { type: "rewrite"; pathname: string }
  | { type: "redirect"; space: StudioSpace; pathname: string }
  | { type: "not-found" };

const PREFIX: Record<Exclude<StudioSpace, "www">, string> = {
  app: "/espace",
  team: "/equipe",
  admin: "/gestion",
};

const EXACT_PATHS: Record<StudioSpace, string[]> = {
  www: ["/", "/studio", "/tarifs", "/projets", "/reserver", "/connexion", "/inscription", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/deconnexion", "/auth/callback", "/auth/accept-invite", "/non-autorise", "/indisponible"],
  app: ["/", "/connexion", "/inscription", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/deconnexion", "/auth/callback", "/reserver", "/non-autorise", "/indisponible"],
  team: ["/", "/connexion", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/deconnexion", "/auth/callback", "/auth/accept-invite", "/non-autorise", "/indisponible"],
  admin: ["/", "/connexion", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/deconnexion", "/auth/callback", "/auth/accept-invite", "/non-autorise", "/indisponible"],
};

function within(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function rewrite(space: Exclude<StudioSpace, "www">, visiblePath: string): HostRoute {
  const internal = PREFIX[space];
  if (visiblePath === "/") return { type: "rewrite", pathname: internal };
  return { type: "rewrite", pathname: `${internal}${visiblePath}` };
}

export function resolveHostRoute(space: StudioSpace, pathname: string): HostRoute {
  if (pathname.startsWith("/api/") || pathname === "/api") return { type: "pass" };

  // Backward-compatible internal paths: redirect to their visible URL on the canonical host.
  for (const target of ["app", "team", "admin"] as const) {
    const internal = PREFIX[target];
    if (within(pathname, internal)) {
      return { type: "redirect", space: target, pathname: pathname.slice(internal.length) || "/" };
    }
  }

  if (space === "www") {
    if (pathname === "/reserver") return { type: "redirect", space: "app", pathname };
    if (pathname === "/connexion" || pathname === "/inscription" || pathname === "/mot-de-passe-oublie" || pathname === "/nouveau-mot-de-passe" || pathname === "/deconnexion" || pathname === "/auth/callback") {
      return { type: "redirect", space: "app", pathname };
    }
    if (pathname === "/auth/accept-invite") return { type: "redirect", space: "team", pathname };
    if (pathname === "/equipe" || pathname.startsWith("/equipe/")) return { type: "redirect", space: "team", pathname: pathname.replace(/^\/equipe/, "") || "/" };
    if (pathname === "/gestion" || pathname.startsWith("/gestion/")) return { type: "redirect", space: "admin", pathname: pathname.replace(/^\/gestion/, "") || "/" };

    if (EXACT_PATHS.www.includes(pathname) || pathname.startsWith("/invite/") || pathname.startsWith("/projets/")) {
      return { type: "pass" };
    }
    return { type: "not-found" };
  }

  if (space === "app") {
    if (pathname === "/espace") return { type: "redirect", space: "app", pathname: "/" };
    if (pathname.startsWith("/espace/")) return { type: "redirect", space: "app", pathname: pathname.slice("/espace".length) };
    if (EXACT_PATHS.app.includes(pathname)) return pathname === "/" ? rewrite("app", "/") : { type: "pass" };
    if (pathname === "/parametres" || pathname.startsWith("/parametres/") || pathname === "/projets" || pathname.startsWith("/projets/")) return rewrite("app", pathname === "/parametres" || pathname.startsWith("/parametres/") ? `/parametres${pathname.slice("/parametres".length)}` : pathname);
    return { type: "not-found" };
  }

  if (space === "team") {
    if (EXACT_PATHS.team.includes(pathname)) return pathname === "/" ? rewrite("team", "/") : { type: "pass" };
    if (pathname === "/equipe") return { type: "redirect", space: "team", pathname: "/" };
    if (pathname.startsWith("/equipe/")) return { type: "redirect", space: "team", pathname: pathname.slice("/equipe".length) };
    if (pathname === "/seances" || pathname.startsWith("/seances/") || pathname === "/projets" || pathname.startsWith("/projets/") || pathname === "/parametres") return rewrite("team", pathname);
    if (pathname === "/auth/accept-invite") return { type: "pass" };
    return { type: "not-found" };
  }

  if (EXACT_PATHS.admin.includes(pathname)) return pathname === "/" ? rewrite("admin", "/") : { type: "pass" };
  if (pathname === "/gestion") return { type: "redirect", space: "admin", pathname: "/" };
  if (pathname.startsWith("/gestion/")) return { type: "redirect", space: "admin", pathname: pathname.slice("/gestion".length) };
  if (["/reservations", "/statistiques", "/emails", "/utilisateurs", "/reglages"].includes(pathname) || ["/reservations/", "/projets/"].some((prefix) => pathname.startsWith(prefix))) return rewrite("admin", pathname);
  return { type: "not-found" };
}

export function redirectLegacyPath(pathname: string): { space: StudioSpace; pathname: string } | null {
  const mappings: Array<[string, StudioSpace, string]> = [
    ["/espace", "app", ""], ["/equipe", "team", ""], ["/gestion", "admin", ""],
  ];
  for (const [prefix, space, replacement] of mappings) {
    if (within(pathname, prefix)) return { space, pathname: `${replacement}${pathname.slice(prefix.length)}` || "/" };
  }
  return null;
}
