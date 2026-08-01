"use client";

/**
 * Command Palette — global, workspace'e özel değil.
 * Kaynak: 04-navigation-system.md §9 (dondurulmuş karar), §10 (klavye)
 *
 * - Ctrl/Cmd + K her ekrandan açar
 * - Aktif workspace'in komutları listenin BAŞINDA
 * - Glass yalnızca overlay katmanında kullanılır (UI-ADR-069) → odin-glass-modal
 *
 * v1.0 kapsamı: navigasyon komutları. Eylem ve AI komutları ilgili sprintlerde
 * eklenecek — karşılığı olmayan komut listeye konmaz.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  useDialogBehavior,
  useDialogDepth,
} from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NAV_GROUPS } from "@/lib/navigation/registry";
import { useUiStore } from "@/lib/store/ui";

interface Command {
  id: string;
  label: string;
  group: string;
  href: string;
  workspaceId: string;
}

const COMMANDS: Command[] = NAV_GROUPS.flatMap((g) =>
  g.items.flatMap((item) => [
    {
      id: item.id,
      label: item.label,
      group: g.label ?? "GENEL",
      href: item.href,
      workspaceId: item.id,
    },
    ...(item.children ?? []).map((c) => ({
      id: c.id,
      label: `${item.label} · ${c.label}`,
      group: g.label ?? "GENEL",
      href: c.href,
      workspaceId: item.id,
    })),
  ])
);

/**
 * Dış kabuk: yalnızca global kısayolu dinler.
 * Panel kapalıyken Palette mount edilmez — böylece her açılışta arama kutusu
 * ve imleç sıfırdan başlar, "aç/kapa'da state sıfırla" efektine gerek kalmaz.
 */
export function CommandPalette({
  activeWorkspaceId,
}: {
  activeWorkspaceId: string | null;
}) {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPalette);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useUiStore.getState().commandPaletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  if (!open) return null;
  return <Palette activeWorkspaceId={activeWorkspaceId} />;
}

function Palette({ activeWorkspaceId }: { activeWorkspaceId: string | null }) {
  const router = useRouter();
  const setOpen = useUiStore((s) => s.setCommandPalette);

  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  /**
   * ODAK TUZAĞI · KAYDIRMA KİLİDİ · ODAK GERİ VERME — UI-ADR-159.
   *
   * Palet `aria-modal="true"` diyordu ama ÜÇÜ DE YOKTU: son sonuçtan
   * sonra Tab odağı perdenin arkasındaki uygulamaya kaçırıyor, kullanıcı
   * hâlâ palette sanıp arkadaki ekrana tıklıyordu. `aria-modal` bir
   * BEYANDIR; davranışı kurmayan bir beyan, ekran okuyucuya yalan söyler.
   *
   * Üçü de `modal.tsx`te zaten yazılıydı; ikinci kez yazmak yerine hook
   * dışarı açıldı (CLAUDE.md §5). Escape de artık kökte — eskiden yalnız
   * `<input>`taydı ve odak bir sonuca geçtiği an ölü tuşa dönüyordu.
   */
  const depth = useDialogDepth();
  const panelRef = useDialogBehavior(true, () => setOpen(false), depth);

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    const matched = q
      ? COMMANDS.filter(
          (c) =>
            c.label.toLocaleLowerCase("tr").includes(q) ||
            c.group.toLocaleLowerCase("tr").includes(q)
        )
      : COMMANDS;

    /* Bağlam duyarlılığı: aktif workspace'in komutları başa alınır (§9). */
    return [...matched].sort((a, b) => {
      const aActive = a.workspaceId === activeWorkspaceId ? 0 : 1;
      const bActive = b.workspaceId === activeWorkspaceId ? 0 : 1;
      return aActive - bActive;
    });
  }, [query, activeWorkspaceId]);

  const run = useCallback(
    (cmd: Command | undefined) => {
      if (!cmd) return;
      setOpen(false);
      router.push(cmd.href);
    },
    [router, setOpen]
  );

  /* Sonuç listesi kısaldıysa imleç dışarı taşmasın. */
  const safeCursor = Math.min(cursor, Math.max(results.length - 1, 0));

  /**
   * İMLEÇ GÖRÜNÜR KALIR — UI-ADR-159.
   *
   * `listRef` tanımlıydı ama HİÇ OKUNMUYORDU: liste `max-h-96` ile
   * kısıtlı ve 30 komutta ok tuşuyla ilerleyen imleç pencereden çıkıp
   * görünmez oluyordu. Klavye kullanıcısı seçili olanı göremeden Enter'a
   * basıyordu — sessiz ve tehlikeli.
   */
  useEffect(() => {
    /* `listId` bağımlılıkta, `optionId` değil: türetilmiş bir fonksiyon
       her render'da yeni kimliktir ve onu bağımlılığa koymak effect'i her
       render'da koştururdu. Bağlı olduğu GERÇEK değer `listId`dir. */
    listRef.current
      ?.querySelector(`#${CSS.escape(`${listId}-opt-${safeCursor}`)}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [safeCursor, results.length, listId]);

  return (
    <div
      className="odin-overlay-scrim fixed inset-0 z-50 flex items-start justify-center p-16"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Komut paleti"
        className="odin-glass-modal w-full max-w-xl overflow-hidden rounded-lg"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="h-4 w-4 text-icon" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={
              results.length > 0 ? optionId(safeCursor) : undefined
            }
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(results[safeCursor]);
              }
            }}
            placeholder="Workspace ara ya da komut yaz…"
            aria-label="Komut ara"
            className="flex-1 bg-transparent text-base text-content outline-none placeholder:text-content-tertiary"
          />
          <kbd className="odin-mono rounded-xs border border-line px-1 text-xs text-content-tertiary">
            Esc
          </kbd>
        </div>

        <ul
          ref={listRef}
          id={listId}
          className="max-h-96 overflow-y-auto p-2"
          role="listbox"
          aria-label="Komutlar"
        >
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-content-tertiary">
              Eşleşen komut yok.
            </li>
          )}
          {/* Öğeler `role="option"` ve ODAK ALMAZ: odak kutuda kalır,
              imleç `aria-activedescendant` ile taşınır. Önce `<li>` içine
              sarılmış `<button role="option">` vardı — option'lar
              listbox'ın DOĞRUDAN çocuğu olmadığı için ilişki kopuktu
              (`ui/search.tsx` aynı kalıbı doğru kuruyor). */}
          {results.map((cmd, i) => (
            <li
              key={cmd.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === safeCursor}
              onMouseEnter={() => setCursor(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(cmd)}
              className={`flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-left text-base ${
                i === safeCursor
                  ? "bg-surface-elevated text-content"
                  : "text-content-secondary"
              }`}
            >
              <span className="truncate">{cmd.label}</span>
              <span className="ml-4 shrink-0 text-xs uppercase tracking-wide text-content-tertiary">
                {cmd.group}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
