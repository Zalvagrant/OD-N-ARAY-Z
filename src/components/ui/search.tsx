"use client";

/**
 * Search — AYRI PRIMITIVE (10-component-library.md §8.5)
 *
 * "Search bir Input değildir." Kendi davranışı vardır:
 * sonuç sayısı · debounce · geçmiş · kısayollar · Command Palette entegrasyonu
 *
 * Anti-fake: `resultCount` verilmediyse (null) sayı gösterilmez. "0 sonuç"
 * ile "henüz aranmadı" farklı şeylerdir; ikincisi sessizdir.
 *
 * Command Palette entegrasyonu: Ctrl/Cmd+K global dinleyicidedir
 * (command-palette.tsx). Search bunu ENGELLEMEZ — kutunun içindeyken de
 * palet açılır. Burada yalnızca kısayol ipucu gösterilir.
 *
 * Desteklenmeyen durumlar: Success / Error — arama sonucu doğrulanacak bir
 * değer değildir. Hatalı sorgu diye bir şey yoktur; sonuç ya vardır ya yoktur.
 */

import { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";

const HISTORY_LIMIT = 5;

function readHistory(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function pushHistory(key: string, value: string): string[] {
  const next = [value, ...readHistory(key).filter((v) => v !== value)].slice(
    0,
    HISTORY_LIMIT
  );
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* Kota dolu ya da özel mod — geçmiş kaybolur, arama çalışmaya devam eder. */
  }
  return next;
}

export function Search({
  placeholder = "Ara…",
  label = "Ara",
  debounceMs = 250,
  resultCount = null,
  searching = false,
  historyKey,
  shortcutHint,
  onSearch,
  onSubmit,
  disabled,
}: {
  placeholder?: string;
  label?: string;
  debounceMs?: number;
  /** Sonuç sayısı. Bilinmiyorsa null — sayı UYDURULMAZ. */
  resultCount?: number | null;
  searching?: boolean;
  /** Verilirse son 5 sorgu localStorage'da tutulur. */
  historyKey?: string;
  /** Örn. "Ctrl K" — yalnızca ipucu, davranışı bu bileşen kurmaz. */
  shortcutHint?: string;
  onSearch: (query: string) => void;
  onSubmit?: (query: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  /* Geçmiş SSR'da boştur (localStorage yok); ilk render'da zaten çizilmediği
     için hidrasyon uyuşmazlığı oluşmaz. Effect'e gerek yok. */
  const [history, setHistory] = useState<string[]>(() =>
    historyKey ? readHistory(historyKey) : []
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Debounce: her tuşta değil, kullanıcı durunca ara.
     onSearch bilerek bağımlılıkta değil — çağıran memoize etmezse her
     render'da sayaç sıfırlanır ve debounce hiç çalışmazdı. */
  useEffect(() => {
    const t = setTimeout(() => onSearch(query), debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, debounceMs]);

  const commit = (value: string) => {
    setQuery(value);
    setHistoryOpen(false);
    if (historyKey && value.trim()) setHistory(pushHistory(historyKey, value));
    onSubmit?.(value);
  };

  const showHistory = historyOpen && !query && history.length > 0;

  return (
    <div className="relative">
      <div className="flex h-10 items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-line-focus">
        {searching ? (
          <Loader2 className="h-4 w-4 animate-spin text-icon" aria-hidden />
        ) : (
          <SearchIcon className="h-4 w-4 text-icon" aria-hidden />
        )}

        <input
          ref={inputRef}
          type="search"
          role="searchbox"
          value={query}
          disabled={disabled}
          aria-label={label}
          aria-busy={searching || undefined}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setHistoryOpen(true)}
          onBlur={() => setTimeout(() => setHistoryOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(query);
            if (e.key === "Escape") {
              e.stopPropagation();
              setQuery("");
              setHistoryOpen(false);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-base text-content outline-none placeholder:text-content-tertiary disabled:opacity-40"
        />

        {/* Sonuç sayısı — yalnızca gerçekten biliniyorsa. */}
        {resultCount !== null && !searching && (
          <span
            className="odin-num shrink-0 text-xs text-content-tertiary"
            aria-live="polite"
          >
            {resultCount} sonuç
          </span>
        )}

        {query && (
          <button
            type="button"
            aria-label="Aramayı temizle"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="shrink-0 rounded-sm p-1 text-icon hover:text-icon-active"
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        )}

        {shortcutHint && !query && (
          <kbd className="odin-mono shrink-0 rounded-xs border border-line px-1 text-xs text-content-tertiary">
            {shortcutHint}
          </kbd>
        )}
      </div>

      {showHistory && (
        <ul
          className="absolute z-40 mt-1 w-full overflow-hidden rounded-sm border border-line bg-surface-floating shadow-e3"
          aria-label="Son aramalar"
        >
          {history.map((h) => (
            <li key={h}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(h)}
                className="w-full truncate px-3 py-2 text-left text-sm text-content-secondary hover:bg-surface-elevated hover:text-content"
              >
                {h}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
