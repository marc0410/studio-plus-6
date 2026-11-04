import { PortalSkeleton } from "@/components/PortalStates";

export default function StaffLoading() {
  return <section aria-label="Chargement de l’espace équipe"><div className="portal-heading"><div className="portal-skeleton portal-skeleton--large" /><div /></div><PortalSkeleton rows={4} /></section>;
}
