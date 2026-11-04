import Link from "next/link";

export const metadata = { title: "Service momentanément indisponible" };

export default function UnavailablePage() {
  return <main className="portal-page"><div className="portal-wrap"><section className="portal-error"><div className="eyebrow"><i />Studio+</div><h1>Le studio revient bientôt.</h1><p>Le service est momentanément indisponible. Vos informations n’ont pas été perdues.</p><Link className="portal-action" href="/">Retour au site</Link></section></div></main>;
}
