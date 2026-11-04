import type { Metadata } from "next";
import { requireRole } from "@/lib/current-profile";
import { StudioSettings } from "@/components/StudioSettings";

export const metadata: Metadata = { title: "Réglages du studio" };
export const dynamic = "force-dynamic";

export default async function StudioSettingsPage() {
  await requireRole(["ADMIN"], "/gestion/reglages");
  return <StudioSettings />;
}
