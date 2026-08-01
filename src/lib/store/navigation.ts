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

"use client";

import { create } from "zustand";
import { usePathname } from "next/navigation";

interface WorkspaceMemory {
  scrollTop: number;
  selectionId?: string;
  /** Geri dönüşte açık kalması gereken kart/bölüm kimlikleri (§5).
      Bellek-içidir, diske YAZILMAZ: dünkü açık kart bugünün verisinde
      anlamsızdır — navigasyon-oturumu durumudur, tercih değil. */
  expandedIds?: string[];
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
  toggleExpandedItem: (workspaceId: string, itemId: string) => void;
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
        /* GİRDİ YAYILIR — UI-ADR-162. Önce yalnız `scrollTop` elle
           taşınıyordu ve `expandedIds` DÜŞÜYORDU: bir satır seçildiğinde
           o workspace'te açık bırakılmış kartlar sessizce kapanıyordu.
           Hemen üstteki `rememberScroll` bunu zaten doğru yazmış — iki
           kardeş ayrışmıştı. Alan eklendikçe elle taşıma unutulur;
           yayma unutulmaz. */
        [id]: { ...s.memory[id], scrollTop: s.memory[id]?.scrollTop ?? 0, selectionId },
      },
    })),

  toggleExpandedItem: (workspaceId, itemId) =>
    set((s) => {
      const entry = s.memory[workspaceId] ?? { scrollTop: 0 };
      const ids = new Set(entry.expandedIds ?? []);
      if (ids.has(itemId)) ids.delete(itemId);
      else ids.add(itemId);
      return {
        memory: {
          ...s.memory,
          [workspaceId]: { ...entry, expandedIds: [...ids] },
        },
      };
    }),
}));

/**
 * Kart/bölüm açılma durumu — bileşen-yerel `useState` DEĞİL.
 * Geri dönüşte açık kart açık kalır (04-...md §12 S2 çıkış kriteri;
 * S1-S5 denetiminde `useState`'in `key={pathname}` unmount'unda kaybolduğu
 * ölçüldü). Kimlik = workspace yolu + kart id'si.
 */
export function useDisclosureMemory(itemId: string): [boolean, () => void] {
  const pathname = usePathname();
  const open = useNavigationStore(
    (s) => s.memory[pathname]?.expandedIds?.includes(itemId) ?? false
  );
  const toggle = () =>
    useNavigationStore.getState().toggleExpandedItem(pathname, itemId);
  return [open, toggle];
}
