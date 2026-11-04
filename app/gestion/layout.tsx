import Link from "next/link";
import { requireRole } from "@/lib/current-profile";

export const dynamic = "force-dynamic";

export default async function ManagementLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireRole(["MANAGER", "ADMIN"], "/gestion");
  return <main className="portal-page"><div className="portal-wrap"><div className="portal-topline"><Link href="/">Studio+ / Pilotage</Link><Link href="/deconnexion">Se déconnecter</Link></div><nav className="portal-nav" aria-label="Navigation gestion"><Link href="/gestion">Vue d’ensemble</Link><Link href="/gestion/reservations">Réservations</Link><Link href="/gestion/statistiques">Statistiques</Link><Link href="/gestion/emails">E-mails</Link>{profile.role === "ADMIN" && <><Link href="/gestion/utilisateurs">Utilisateurs</Link><Link href="/gestion/reglages">Réglages</Link></>}<Link href="/equipe">Espace équipe</Link></nav>{children}</div></main>;
}
