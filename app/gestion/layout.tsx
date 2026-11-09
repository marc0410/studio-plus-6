import { requireRole } from "@/lib/current-profile";
import { PortalShell } from "@/components/PortalShell";

export const dynamic = "force-dynamic";

export default async function ManagementLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireRole(["MANAGER", "ADMIN"], "/gestion");
  return <PortalShell area="management" role={profile.role} name={profile.fullName}>{children}</PortalShell>;
}
