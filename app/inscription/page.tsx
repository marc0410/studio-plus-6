import type { Metadata } from "next";
import { AuthFlow } from "@/components/AuthFlows";
import "../connexion/connexion.css";

export const metadata: Metadata = { title: "Créer un espace client" };
export default function SignUpPage() { return <AuthFlow flow="signup" />; }
