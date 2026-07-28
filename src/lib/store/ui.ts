/**
 * UI tercihleri — kalıcı.
 * Kaynak: 04-navigation-system.md §6 (sidebar tercihi hatırlanır)
 *         04-navigation-system.md §11 (context panel durum makinesi)
 *
 * Context panel durumu global tutulur; "Pinned" workspace değişse bile
 * açık kalmak zorundadır.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ContextPanelState = "closed" | "preview" | "expanded" | "pinned";

interface UiState {
  sidebarCollapsed: boolean;
  contextPanel: ContextPanelState;
  commandPaletteOpen: boolean;

  toggleSidebar: () => void;
  setContextPanel: (s: ContextPanelState) => void;
  /** Workspace değişince çağrılır — Pinned dışındaki durumlar sıfırlanır. */
  resetContextPanelOnNavigate: () => void;
  setCommandPalette: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      contextPanel: "closed",
      commandPaletteOpen: false,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setContextPanel: (contextPanel) => set({ contextPanel }),

      resetContextPanelOnNavigate: () =>
        set((s) => (s.contextPanel === "pinned" ? s : { contextPanel: "closed" })),

      setCommandPalette: (commandPaletteOpen) => set({ commandPaletteOpen }),
    }),
    {
      name: "odin.ui",
      /* Command palette anlık bir durumdur, diske yazılmaz. */
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        contextPanel: s.contextPanel,
      }),
    }
  )
);
