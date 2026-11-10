import Link from "next/link";
import { PortalNav } from "@/components/PortalNav";
import { PortalThemeToggle } from "@/components/PortalThemeToggle";
import { spaceOrigin } from "@/lib/hosts";
import type { AppRole } from "@/lib/roles";
import { PortalQuickSearch } from "@/components/PortalQuickSearch";
import { PortalIcon } from "@/components/PortalIcon";

export function PortalShell({ children, area, role, name }: {
  children: React.ReactNode;
  area: "app" | "team" | "management";
  role: AppRole;
  name: string;
}) {
  const firstName = name.trim().split(/\s+/)[0] || "Équipe";
  return <div className="portal-app-shell" data-area={area}>
    <aside className="portal-sidebar">
      <Link className="portal-brand" href={area === "app" ? "/espace" : area === "team" ? "/equipe" : "/gestion"} aria-label="Studio+ accueil"><span>+</span><b>Studio<span>+</span></b></Link>
      <PortalNav area={area} admin={area === "team" ? role === "ADMIN" || role === "MANAGER" : role === "ADMIN"} />
      <div className="portal-sidebar-bottom">
        <Link href={spaceOrigin("www")} className="portal-space-link" aria-label="Voir le site public" title="Voir le site public"><PortalIcon name="external" size={18} /><span>Voir le site</span></Link>
      </div>
    </aside>
    <section className="portal-workspace">
      <header className="portal-app-topbar">
        <div className="portal-breadcrumb"><span>Studio+</span><i>/</i><strong>{area === "app" ? "Mon espace" : area === "team" ? "Équipe" : "Gestion"}</strong></div>
        <div className="portal-topbar-actions">
          {process.env.VERCEL_ENV !== "production" && <span className="portal-env-badge">DEV</span>}
          <PortalQuickSearch area={area} role={role} />
          <PortalThemeToggle />
          <details className="portal-account-menu"><summary><span>{firstName.slice(0, 1).toUpperCase()}</span><b>{firstName}</b><PortalIcon name="arrowDown" size={15} /></summary><div><p>Connecté en tant que {firstName}</p><Link href={area === "app" ? "/espace/parametres" : area === "team" ? "/equipe/parametres" : "/gestion/reglages"}><PortalIcon name="settings" size={16} />Paramètres</Link>{area === "team" && (role === "MANAGER" || role === "ADMIN") && <Link href={spaceOrigin("admin")}><PortalIcon name="chart" size={16} />Ouvrir la gestion</Link>}{area === "management" && <Link href={spaceOrigin("team")}><PortalIcon name="people" size={16} />Espace équipe</Link>}{area === "app" && <Link href={spaceOrigin("www")}><PortalIcon name="external" size={16} />Voir le site</Link>}<Link href="/deconnexion"><PortalIcon name="logout" size={16} />Se déconnecter</Link></div></details>
        </div>
      </header>
      <div className="portal-content" role={area === "app" ? undefined : "main"}>{children}</div>
    </section>
  </div>;
}
