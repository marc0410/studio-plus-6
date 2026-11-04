import type { Metadata } from "next";
import { AuthFlow } from "@/components/AuthFlows";
import "../connexion/connexion.css";

export const metadata: Metadata = { title: "Récupérer son accès" };
export default function RecoveryPage() { return <AuthFlow flow="recovery" />; }
