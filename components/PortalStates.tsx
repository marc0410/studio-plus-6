import Link from "next/link";

export function PortalSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="portal-loading" role="status" aria-label="Chargement de l’espace" aria-busy="true">
    <span className="portal-sr-only">Chargement des informations…</span>
    <div className="portal-loading-heading" aria-hidden="true"><span className="portal-skeleton portal-skeleton--eyebrow" /><span className="portal-skeleton portal-skeleton--title" /><span className="portal-skeleton portal-skeleton--copy" /></div>
    <div className="portal-loading-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => <div className="portal-loading-row" key={index}><span className="portal-skeleton portal-skeleton--mark" /><span className="portal-loading-lines"><span className="portal-skeleton portal-skeleton--line" /><span className="portal-skeleton portal-skeleton--line portal-skeleton--short" /></span><span className="portal-skeleton portal-skeleton--action" /></div>)}
    </div>
  </div>;
}

export function PortalEmpty({ title, detail, href, action }: { title: string; detail: string; href: string; action: string }) {
  return <section className="portal-empty" aria-live="polite"><div className="eyebrow"><i />Studio+</div><h2>{title}</h2><p>{detail}</p><Link className="portal-action" href={href}>{action}</Link></section>;
}

