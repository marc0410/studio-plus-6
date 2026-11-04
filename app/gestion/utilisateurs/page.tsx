import type { Metadata } from "next";
import { requireRole } from "@/lib/current-profile";
import { AdminUsers } from "@/components/AdminUsers";

export const metadata: Metadata = { title: "Comptes et rôles" };
export const dynamic = "force-dynamic";
export default async function AdminUsersPage() { await requireRole(["ADMIN"], "/gestion/utilisateurs"); return <AdminUsers />; }
