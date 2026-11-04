import type { Metadata } from "next";
import { AuthFlow } from "@/components/AuthFlows";
import "../connexion/connexion.css";

export const metadata: Metadata = { title: "Nouveau mot de passe" };
export default function UpdatePasswordPage() { return <AuthFlow flow="update" />; }
