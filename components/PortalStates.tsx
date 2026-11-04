import Link from "next/link";

export function PortalSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="portal-skeleton-stack" aria-label="Chargement" aria-busy="true">
    <span className="portal-skeleton portal-skeleton--wide" />
    {Array.from({ length: rows }, (_, index) => <span className="portal-skeleton portal-skeleton--large" key={index} />)}
  </div>;
}

export function PortalEmpty({ title, detail, href, action }: { title: string; detail: string; href: string; action: string }) {
  return <section className="portal-empty" aria-live="polite"><div className="eyebrow"><i />Studio+</div><h2>{title}</h2><p>{detail}</p><Link className="portal-action" href={href}>{action}</Link></section>;
}

