export const APP_ROLES = ["ADMIN", "MANAGER", "STAFF", "CLIENT"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_HOME: Record<AppRole, string> = {
  ADMIN: "/gestion",
  MANAGER: "/gestion",
  STAFF: "/equipe",
  CLIENT: "/espace",
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}
