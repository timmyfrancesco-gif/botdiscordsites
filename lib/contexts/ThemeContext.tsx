"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

const STORAGE_KEY = "hm_site_theme";

const BASE_ACCENT = "#ff2d34";

function hexToRgbTriplet(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
}

/** Overrides just the accent hue on top of the single ENVY_ARES base theme (used for per-tenant branding). */
function applyAccentOverride(accentColor: string | null | undefined) {
  const root = document.documentElement;
  if (!accentColor) {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-soft");
    root.style.removeProperty("--accent-rgb");
    return;
  }
  const rgb = hexToRgbTriplet(accentColor);
  if (!rgb) return;
  root.style.setProperty("--accent", accentColor);
  root.style.setProperty("--accent-soft", `${accentColor}1a`);
  root.style.setProperty("--accent-rgb", rgb);
}

interface ThemeContextValue {
  setAccentOverride: (accentColor: string | null | undefined) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  setAccentOverride: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Wipe out any old per-browser theme override (from the retired
    // Heaven/Hyper theme switcher) that would otherwise keep clobbering
    // the site's CSS variables with the wrong palette on every load.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable (private mode) — nothing to clean up
    }
    const root = document.documentElement;
    root.style.removeProperty("--background");
    root.style.removeProperty("--background-elevated");
    root.style.removeProperty("--foreground");
    root.style.removeProperty("--muted");
    root.style.removeProperty("--border");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-soft");
    root.style.removeProperty("--casino-from");
    root.style.removeProperty("--casino-to");
  }, []);

  return <ThemeContext value={{ setAccentOverride: applyAccentOverride }}>{children}</ThemeContext>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { BASE_ACCENT };
