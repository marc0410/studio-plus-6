import Link from "next/link";
import { requireRole } from "@/lib/current-profile";
import { PortalNav } from "@/components/PortalNav";
import { PortalThemeToggle } from "@/components/PortalThemeToggle";

export const dynamic = "force-dynamic";

export default async function ManagementLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireRole(["MANAGER", "ADMIN"], "/gestion");
  return <main className="portal-page"><div className="portal-wrap"><div className="portal-topline"><Link href="/">Studio+ / Pilotage</Link><div className="portal-topline-actions"><PortalThemeToggle /><Link href="/deconnexion">Se déconnecter</Link></div></div><PortalNav area="management" admin={profile.role === "ADMIN"} />{children}</div></main>;
}
