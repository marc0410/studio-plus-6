"use client";

import { usePortalTheme } from "@/components/PortalThemeProvider";
import { PortalIcon } from "@/components/PortalIcon";

export function PortalThemeToggle() {
  const { theme, toggle } = usePortalTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="portal-theme-toggle"
      onClick={toggle}
      aria-label={isDark ? "Passer au mode clair" : "Passer au mode sombre"}
      aria-pressed={isDark}
      title={isDark ? "Passer au mode clair" : "Passer au mode sombre"}
    >
      <PortalIcon name={isDark ? "sun" : "moon"} size={17} />
      <span>{isDark ? "Passer au clair" : "Passer au sombre"}</span>
    </button>
  );
}
