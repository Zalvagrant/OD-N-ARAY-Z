/**
 * ODIN Theme Provider
 * Kaynak: docs/ui_chatgpt/11-design-tokens.md §7
 *
 * ADR-075: v1.0'da yalnızca Executive Dark aktif.
 * Diğer temalar tanımlı ama kapalı — açmak için `enabled: true` yeter.
 * Tema eklemek KOD DEĞİŞİKLİĞİ GEREKTİRMEZ (11-...md §7 kuralı).
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export const THEMES = [
  { id: "executive-dark",  label: "Executive Dark",  enabled: true  },
  { id: "executive-light", label: "Executive Light", enabled: false }, // v1.1
  { id: "presentation",    label: "Presentation",    enabled: false }, // v2
  { id: "wallboard",       label: "Wallboard",       enabled: false }, // v2
  { id: "high-contrast",   label: "High Contrast",   enabled: false }, // v2
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const DEFAULT_THEME: ThemeId = "executive-dark";
const STORAGE_KEY = "odin.theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  availableThemes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);

  // Kayıtlı tercihi yükle
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      const isValid = THEMES.some((t) => t.id === saved && t.enabled);
      if (saved && isValid) setThemeState(saved);
    } catch {
      /* storage kapalıysa varsayılanla devam et */
    }
  }, []);

  // DOM'a uygula
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (next: ThemeId) => {
    const target = THEMES.find((t) => t.id === next);
    if (!target?.enabled) {
      console.warn(`[ODIN] Tema "${next}" henüz aktif değil.`);
      return;
    }
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* yoksay */
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, availableThemes: THEMES }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme, ThemeProvider içinde kullanılmalı");
  return ctx;
}
