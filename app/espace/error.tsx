"use client";

import { useEffect } from "react";
import { PortalError } from "@/components/PortalErrorState";

export default function ClientSpaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Client space route error", error); }, [error]);
  return <main className="portal-page"><div className="portal-wrap"><PortalError title="Votre espace est momentanément indisponible." retry={reset} /></div></main>;
}
