import type { AppRole } from "./roles.ts";

export type StudioSpace = "www" | "app" | "team" | "admin";

const productionHosts: Record<StudioSpace, string> = {
  www: "www.studioplusci.com",
  app: "app.studioplusci.com",
  team: "team.studioplusci.com",
  admin: "admin.studioplusci.com",
};

const previewHosts: Record<StudioSpace, string> = {
  www: "dev.studioplusci.com",
  app: "dev-app.studioplusci.com",
  team: "dev-team.studioplusci.com",
  admin: "dev-admin.studioplusci.com",
};

function normalizeHost(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\.$/, "") ?? "";
}

function runtimeHosts(): Record<StudioSpace, string> {
  const production = process.env.VERCEL_ENV === "production";
  const defaults = production ? productionHosts : process.env.VERCEL_ENV === "preview" ? previewHosts : {
    www: "localhost:3000",
    app: "app.localhost:3000",
    team: "team.localhost:3000",
    admin: "admin.localhost:3000",
  };

  return {
    www: normalizeHost(process.env.NEXT_PUBLIC_HOST_WWW) || defaults.www,
    app: normalizeHost(process.env.NEXT_PUBLIC_HOST_APP) || defaults.app,
    team: normalizeHost(process.env.NEXT_PUBLIC_HOST_TEAM) || defaults.team,
    admin: normalizeHost(process.env.NEXT_PUBLIC_HOST_ADMIN) || defaults.admin,
  };
}

export function spaceFromHost(host: string | null | undefined): StudioSpace | null {
  const normalized = normalizeHost(host);
  const hosts = runtimeHosts();
  for (const space of Object.keys(hosts) as StudioSpace[]) {
    if (normalized === hosts[space]) return space;
  }

  // Keep the public Vercel alias and current development host usable during rollout.
  if (normalized === "studio-plus-pink.vercel.app" || normalized === "dev.studioplusci.com") return "www";
  return null;
}

export function canonicalHost(space: StudioSpace): string {
  return runtimeHosts()[space];
}

export function spaceOrigin(space: StudioSpace): string {
  const host = canonicalHost(space);
  return host.includes("localhost") ? `http://${host}` : `https://${host}`;
}

export function canonicalSpaceForRole(role: AppRole): StudioSpace {
  if (role === "CLIENT") return "app";
  if (role === "STAFF") return "team";
  return "admin";
}

export function roleAllowedOnSpace(role: AppRole, space: StudioSpace) {
  if (space === "app") return role === "CLIENT";
  if (space === "team") return role === "STAFF" || role === "MANAGER" || role === "ADMIN";
  if (space === "admin") return role === "MANAGER" || role === "ADMIN";
  return false;
}

export function isLegacySingleHost(host: string | null | undefined) {
  const normalized = normalizeHost(host);
  return normalized === "localhost:3000" || normalized === "dev.studioplusci.com" || normalized === "studio-plus-pink.vercel.app";
}
