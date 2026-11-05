"use client";

export function PortalError({ title = "La page n’a pas pu se charger.", retry }: { title?: string; retry?: () => void }) {
  return <section className="portal-error" role="alert"><div className="eyebrow"><i />Problème de chargement</div><h2>{title}</h2><p>Vérifiez votre connexion puis réessayez. Si le problème persiste, revenez à votre espace et contactez le studio.</p>{retry && <button className="portal-action" onClick={retry}>Réessayer</button>}</section>;
}
