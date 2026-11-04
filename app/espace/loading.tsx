import { PortalSkeleton } from "@/components/PortalStates";

export default function ClientLoading() {
  return <main className="portal-page"><div className="portal-wrap"><div className="portal-heading"><div className="portal-skeleton portal-skeleton--large" /><div /></div><PortalSkeleton rows={5} /></div></main>;
}
