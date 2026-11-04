import type { Metadata } from "next";
import { InvitationResponse } from "@/components/InvitationResponse";

export const metadata: Metadata = { title: "Invitation podcast" };
export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InvitationResponse token={token} />;
}
