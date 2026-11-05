import { PortalSkeleton } from "@/components/PortalStates";

export default function ClientLoading() {
  return <main className="portal-page"><div className="portal-wrap"><PortalSkeleton rows={5} /></div></main>;
}
