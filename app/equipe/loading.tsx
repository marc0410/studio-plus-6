import { PortalSkeleton } from "@/components/PortalStates";

export default function StaffLoading() {
  return <section className="portal-loading-root" aria-label="Chargement de l’espace équipe"><PortalSkeleton rows={4} /></section>;
}
