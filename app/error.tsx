"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("App route error", error); }, [error]);
  return <main className="portal-page"><div className="portal-wrap"><section className="portal-error" role="alert"><div className="eyebrow"><i />Studio+</div><h1>La page est momentanément indisponible.</h1><p>Vos informations sont conservées. Réessayez ou revenez à l’accueil du studio.</p><div className="portal-nav"><button className="portal-filter" onClick={reset}>Réessayer</button><Link href="/">Retour à Studio+</Link></div></section></div></main>;
}
