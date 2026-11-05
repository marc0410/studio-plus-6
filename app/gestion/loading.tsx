import { PortalSkeleton } from "@/components/PortalStates";

export default function ManagementLoading() {
  return <section className="portal-loading-root" aria-label="Chargement du tableau de bord"><PortalSkeleton rows={5} /></section>;
}
