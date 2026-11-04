import Link from "next/link";
import { requireRole } from "@/lib/current-profile";

export const dynamic = "force-dynamic";

export default async function StaffAreaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireRole(["STAFF", "MANAGER", "ADMIN"], "/equipe");
  return <main className="portal-page"><div className="portal-wrap"><div className="portal-topline"><Link href="/">Studio+ / Espace équipe</Link><Link href="/deconnexion">Se déconnecter</Link></div><nav className="portal-nav" aria-label="Navigation équipe"><Link href="/equipe">Aujourd’hui</Link><Link href="/equipe/seances">Séances</Link><Link href="/equipe/parametres">Mon compte</Link>{profile.role !== "STAFF" && <Link href="/gestion">Gestion</Link>}</nav>{children}</div></main>;
}
