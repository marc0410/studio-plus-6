"use client";

import { useEffect } from "react";
import { PortalError } from "@/components/PortalErrorState";

export default function StaffError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Staff route error", error); }, [error]);
  return <PortalError title="L’espace équipe est momentanément indisponible." retry={reset} />;
}
