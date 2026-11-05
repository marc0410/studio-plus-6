"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PortalTheme = "light" | "dark";
const STORAGE_KEY = "studio-plus-portal-theme";
const PortalThemeContext = createContext<{ theme: PortalTheme; toggle: () => void }>({ theme: "light", toggle: () => {} });

export function PortalThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<PortalTheme>("light");

  useEffect(() => {
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(STORAGE_KEY); } catch { /* Storage can be disabled by browser policy. */ }
    const initial = stored === "dark" || stored === "light" ? stored : "light";
    document.documentElement.dataset.portalTheme = initial;
    setTheme(initial);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.portalTheme = next;
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* Keep the in-memory theme even when storage is unavailable. */ }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <PortalThemeContext.Provider value={value}>{children}</PortalThemeContext.Provider>;
}

export function usePortalTheme() {
  return useContext(PortalThemeContext);
}
