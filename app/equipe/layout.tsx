import Link from "next/link";
import { requireRole } from "@/lib/current-profile";
import { PortalNav } from "@/components/PortalNav";
import { PortalThemeToggle } from "@/components/PortalThemeToggle";
import { spaceOrigin } from "@/lib/hosts";

export const dynamic = "force-dynamic";

export default async function StaffAreaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireRole(["STAFF", "MANAGER", "ADMIN"], "/equipe");
  return <main className="portal-page"><div className="portal-wrap"><div className="portal-topline"><a href={spaceOrigin("www")}>Studio+ / Espace équipe</a><div className="portal-topline-actions"><PortalThemeToggle /><Link href="/deconnexion">Se déconnecter</Link></div></div><PortalNav area="team" admin={profile.role !== "STAFF"} />{children}</div></main>;
}
