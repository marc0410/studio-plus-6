"use client";

import { useEffect } from "react";
import { PortalError } from "@/components/PortalErrorState";

export default function ManagementError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Management route error", error); }, [error]);
  return <PortalError title="Le tableau de gestion est momentanément indisponible." retry={reset} />;
}
