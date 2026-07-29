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

/**
 * Sağ bağlam panelinde gösterilecek nesnenin KİMLİĞİ — UI-ADR-098.
 *
 * Ekran (`Workspace` içindeki children) ile sağ panel KARDEŞTİR; biri
 * diğerinin çocuğu değildir. Seçim bu yüzden ortak bir yerde durmak zorunda.
 *
 * NESNENİN KENDİSİ SAKLANMAZ, yalnızca kimliği. Kopya veri bayatlar ve
 * kaynağıyla çelişir; panel aynı kanonik kaynaktan `id` ile okur, bulamazsa
 * detay uydurmaz — NoData gösterir.
 */
export interface SelectedEntity {
  /** Seçimi yapan workspace — başka workspace'e geçilince temizlenir. */
  workspaceId: string;
  /** "sku" gibi nesne türü; panel hangi sağlayıcıyı çizeceğini bundan bilir. */
  kind: string;
  id: string;
}

interface UiState {
  sidebarCollapsed: boolean;
  contextPanel: ContextPanelState;
  commandPaletteOpen: boolean;
  selectedEntity: SelectedEntity | null;

  toggleSidebar: () => void;
  setContextPanel: (s: ContextPanelState) => void;
  /** Workspace değişince çağrılır — Pinned dışındaki durumlar sıfırlanır. */
  resetContextPanelOnNavigate: () => void;
  setCommandPalette: (open: boolean) => void;
  setSelectedEntity: (e: SelectedEntity | null) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      contextPanel: "closed",
      commandPaletteOpen: false,
      selectedEntity: null,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setContextPanel: (contextPanel) => set({ contextPanel }),

      /* Seçim workspace'e aittir: Pinned panel açık kalsa bile başka bir
         workspace'in seçili nesnesi orada durmaz. */
      resetContextPanelOnNavigate: () =>
        set((s) => ({
          selectedEntity: null,
          contextPanel: s.contextPanel === "pinned" ? s.contextPanel : "closed",
        })),

      setCommandPalette: (commandPaletteOpen) => set({ commandPaletteOpen }),

      setSelectedEntity: (selectedEntity) => set({ selectedEntity }),
    }),
    {
      name: "odin.ui",
      /* Command palette anlık bir durumdur, diske yazılmaz.
         Seçili nesne de yazılmaz: oturumlar arası taşınan bir seçim,
         kaynağı değişmiş olabilecek bir id'yi diriltir. */
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        contextPanel: s.contextPanel,
      }),
    }
  )
);
