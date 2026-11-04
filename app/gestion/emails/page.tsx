import type { Metadata } from "next";
import { EmailDeliveryManager } from "@/components/EmailDeliveryManager";

export const metadata: Metadata = { title: "E-mails transactionnels" };
export default function EmailDeliveryPage() { return <EmailDeliveryManager />; }
