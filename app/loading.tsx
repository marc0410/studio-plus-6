import { PortalSkeleton } from "@/components/PortalStates";

export default function AppLoading() {
  return <main className="portal-page"><div className="portal-wrap" aria-label="Chargement de la page"><div className="portal-skeleton-stack"><span className="portal-skeleton portal-skeleton--wide" /><span className="portal-skeleton portal-skeleton--large" /><PortalSkeleton rows={3} /></div></div></main>;
}
