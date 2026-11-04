import type { Metadata } from "next";
import { ManagerBookings } from "@/components/ManagerBookings";

export const metadata: Metadata = { title: "Gestion des réservations" };
export const dynamic = "force-dynamic";
export default function ManagementBookingsPage() { return <ManagerBookings />; }
