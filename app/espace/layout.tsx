import { requireRole } from "@/lib/current-profile";
import { PortalShell } from "@/components/PortalShell";

export const dynamic = "force-dynamic";

export default async function ClientAreaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireRole(["CLIENT"], "/espace");
  return <PortalShell area="app" role={profile.role} name={profile.fullName}>{children}</PortalShell>;
}
