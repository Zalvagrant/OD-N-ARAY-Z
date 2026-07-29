"use client";

/**
 * Right Context Panel — TÜM modüller aynı bileşeni kullanır.
 * Kaynak: 04-navigation-system.md §11, 03-information-architecture.md §7
 *
 * Durum makinesi: Closed → Preview → Expanded → Pinned
 * Pinned, workspace değişse bile açık kalır (durum global store'da).
 *
 * Modüle özel context panel YAZILMAZ; yalnızca içerik sağlayıcısı değişir.
 */

import { Pin, PinOff, PanelRight, X, Maximize2, Minimize2 } from "lucide-react";
import { useUiStore, type ContextPanelState } from "@/lib/store/ui";
import { EmptyState } from "@/components/ui/empty-state";

const WIDTH: Record<Exclude<ContextPanelState, "closed">, string> = {
  preview: "w-64",
  expanded: "w-96",
  pinned: "w-96",
};

export function RightContextPanel({
  workspaceLabel,
  children,
}: {
  workspaceLabel: string;
  /**
   * Workspace'in içerik sağlayıcısı (§7: kabuk sabit, içerik değişken).
   * Verilmezse "seçili nesne yok" boş durumu kalır.
   */
  children?: React.ReactNode;
}) {
  const state = useUiStore((s) => s.contextPanel);
  const setState = useUiStore((s) => s.setContextPanel);

  if (state === "closed") {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-l border-line bg-bg-secondary py-2">
        <button
          type="button"
          onClick={() => setState("preview")}
          title="Bağlam panelini aç"
          aria-label="Bağlam panelini aç"
          className="rounded-sm p-2 text-icon hover:bg-surface hover:text-icon-active"
        >
          <PanelRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  const pinned = state === "pinned";

  return (
    <aside
      className={`flex shrink-0 flex-col border-l border-line bg-bg-secondary ${WIDTH[state]}`}
      aria-label="Bağlam paneli"
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-line px-3">
        <span className="truncate text-sm text-content-secondary">
          {workspaceLabel} · Bağlam
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setState(state === "preview" ? "expanded" : "preview")}
            title={state === "preview" ? "Genişlet" : "Daralt"}
            aria-label={state === "preview" ? "Genişlet" : "Daralt"}
            className="rounded-sm p-1 text-icon hover:text-icon-active"
          >
            {state === "preview" ? (
              <Maximize2 className="h-3 w-3" aria-hidden />
            ) : (
              <Minimize2 className="h-3 w-3" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => setState(pinned ? "expanded" : "pinned")}
            title={pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
            aria-label={pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
            className={`rounded-sm p-1 hover:text-icon-active ${
              pinned ? "text-ai" : "text-icon"
            }`}
          >
            {pinned ? (
              <PinOff className="h-3 w-3" aria-hidden />
            ) : (
              <Pin className="h-3 w-3" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => setState("closed")}
            title="Kapat"
            aria-label="Bağlam panelini kapat"
            className="rounded-sm p-1 text-icon hover:text-icon-active"
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {children ?? (
          <EmptyState
            title="Seçili nesne yok"
            description="Bu panel seçtiğin nesnenin detayını gösterir: ilgili kararlar, görevler, belgeler ve AI analizi."
            suggestion="Bir workspace'te satır ya da kart seç; detay ekran değiştirmeden burada açılır."
            example="Amazon → SKU seç → finansal metrikler + AI önerisi"
          />
        )}
      </div>
    </aside>
  );
}
