import type { Metadata } from "next";
import { ManagerBookings } from "@/components/ManagerBookings";
import { ManagementCalendarView } from "@/components/ManagementCalendarView";

export const metadata: Metadata = { title: "Gestion des réservations" };
export const dynamic = "force-dynamic";
export default async function ManagementBookingsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  return view === "calendar" ? <ManagementCalendarView /> : <ManagerBookings />;
}
