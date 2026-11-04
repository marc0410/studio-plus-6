import Link from "next/link";

export default function NotFound() {
  return <main className="portal-page"><div className="portal-wrap"><section className="portal-empty"><div className="eyebrow"><i />Erreur 404</div><h1>Cette page n’existe pas.</h1><p>Le lien a peut-être changé. Reprenez votre parcours depuis Studio+.</p><Link href="/" className="portal-action">Retour à l’accueil ↗</Link></section></div></main>;
}
