/**
 * Navigation Store — TEK kaynak.
 * Kaynak: 04-navigation-system.md §12
 *
 * Hiçbir bileşen kendi route state'ini tutmaz. Aktif workspace, açık alt menü
 * ve bağlam hafızası (scroll + seçim) yalnızca buradadır.
 *
 * Neden hafıza: navigation bir "sayfa geçişi" değil "bağlam değişimi"dir
 * (§5). Geri dönüşte önceki bağlam aynı scroll ve seçim durumunda açılır.
 */

import { create } from "zustand";

interface WorkspaceMemory {
  scrollTop: number;
  selectionId?: string;
}

interface NavigationState {
  activeWorkspaceId: string | null;
  /** Sidebar'da alt menüsü açık olan modül — aynı anda EN FAZLA BİR tane */
  expandedId: string | null;
  memory: Record<string, WorkspaceMemory>;

  setActiveWorkspace: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
  rememberScroll: (id: string, scrollTop: number) => void;
  rememberSelection: (id: string, selectionId: string | undefined) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeWorkspaceId: null,
  expandedId: null,
  memory: {},

  setActiveWorkspace: (id) =>
    set((s) => ({
      activeWorkspaceId: id,
      /* Modül değişince önceki alt menü otomatik kapanır (§4).
         Aynı modül içinde gezinirken kullanıcının manuel açtığı korunur. */
      expandedId: id === s.activeWorkspaceId ? s.expandedId : id,
    })),

  toggleExpanded: (id) =>
    set((s) => ({ expandedId: s.expandedId === id ? null : id })),

  rememberScroll: (id, scrollTop) =>
    set((s) => ({
      memory: { ...s.memory, [id]: { ...s.memory[id], scrollTop } },
    })),

  rememberSelection: (id, selectionId) =>
    set((s) => ({
      memory: {
        ...s.memory,
        [id]: { scrollTop: s.memory[id]?.scrollTop ?? 0, selectionId },
      },
    })),
}));
