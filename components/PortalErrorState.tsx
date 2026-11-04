"use client";

export function PortalError({ title = "La page n’a pas pu se charger.", retry }: { title?: string; retry?: () => void }) {
  return <section className="portal-error" role="alert"><h2>{title}</h2><p>Vos informations sont conservées. Réessayez dans un instant.</p>{retry && <button className="portal-action" onClick={retry}>Réessayer</button>}</section>;
}
