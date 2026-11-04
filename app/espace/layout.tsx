import { requireRole } from "@/lib/current-profile";

export const dynamic = "force-dynamic";

export default async function ClientAreaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["CLIENT"], "/espace");
  return children;
}
