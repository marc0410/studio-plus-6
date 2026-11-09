"use client";

import { usePortalTheme } from "@/components/PortalThemeProvider";

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
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
        {isDark ? (
          <path d="M16.7 12.3A7.2 7.2 0 0 1 7.7 3.3a7.3 7.3 0 1 0 9 9Z" />
        ) : (
          <><circle cx="10" cy="10" r="3.3" /><path d="M10 1.8v1.5m0 13.4v1.5M18.2 10h-1.5M3.3 10H1.8m14-5.8-1.1 1.1M5.3 14.7l-1.1 1.1m11.6 0-1.1-1.1M5.3 5.3 4.2 4.2" /></>
        )}
      </svg>
      <span>{isDark ? "Passer au clair" : "Passer au sombre"}</span>
    </button>
  );
}
