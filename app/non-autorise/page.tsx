import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { ROLE_HOME } from "@/lib/roles";

export const metadata = { title: "Accès non autorisé" };
export const dynamic = "force-dynamic";

export default async function AccessDeniedPage() {
  const profile = await getCurrentProfile();
  const destination = profile ? ROLE_HOME[profile.role] : "/connexion";
  return <main className="portal-page"><div className="portal-wrap"><section className="portal-error"><div className="eyebrow"><i />Accès protégé</div><h1>Cette page n’est pas accessible avec votre rôle.</h1><p>Votre compte reste actif. Revenez à votre espace pour poursuivre.</p><Link className="portal-action" href={destination}>{profile ? "Retour à mon espace" : "Se connecter"} ↗</Link></section></div></main>;
}
