import { PortalSkeleton } from "@/components/PortalStates";

export default function ManagementLoading() {
  return <section aria-label="Chargement du tableau de bord"><div className="portal-heading"><div className="portal-skeleton portal-skeleton--large" /><div className="portal-skeleton portal-skeleton--large" /></div><PortalSkeleton rows={5} /></section>;
}
