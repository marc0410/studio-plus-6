import Link from "next/link";
import { requireRole } from "@/lib/current-profile";
import { PortalNav } from "@/components/PortalNav";
import { PortalThemeToggle } from "@/components/PortalThemeToggle";

export const dynamic = "force-dynamic";

export default async function StaffAreaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireRole(["STAFF", "MANAGER", "ADMIN"], "/equipe");
  return <main className="portal-page"><div className="portal-wrap"><div className="portal-topline"><Link href="/">Studio+ / Espace équipe</Link><div className="portal-topline-actions"><PortalThemeToggle /><Link href="/deconnexion">Se déconnecter</Link></div></div><PortalNav area="team" admin={profile.role !== "STAFF"} />{children}</div></main>;
}
