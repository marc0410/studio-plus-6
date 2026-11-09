import { AccountSettings } from "@/components/AccountSettings";
import { AvailabilitySettings } from "@/components/AvailabilitySettings";
import { requireRole } from "@/lib/current-profile";
export const dynamic = "force-dynamic";
export default async function StaffAccountPage() {
  const profile = await requireRole(["STAFF", "MANAGER", "ADMIN"], "/equipe/parametres");
  return <><div id="compte"><AccountSettings backHref="/equipe" embedded /></div>{profile.role === "STAFF" && <section id="disponibilites" className="team-availability-section"><header className="portal-heading"><div><div className="eyebrow"><i />Agenda équipe</div><h1>Mes disponibilités.</h1></div><p>Définissez vos horaires récurrents et signalez les jours où votre planning change.</p></header><AvailabilitySettings /></section>}</>;
}
