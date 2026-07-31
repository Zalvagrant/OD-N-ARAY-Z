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

import { useEffect, useId, useRef, useState } from "react";
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
  /** Klavye imleci. -1 = liste açık ama hiçbir öğe seçili değil. */
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

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
    setActive(-1);
    if (historyKey && value.trim()) setHistory(pushHistory(historyKey, value));
    onSubmit?.(value);
  };

  const showHistory = historyOpen && !query && history.length > 0;

  /**
   * KLAVYE — UI-ADR-141. Öncesi ölçüldü ve üç ayrı kusur vardı:
   *
   *  1. Geçmiş listesi `role="listbox"` DEĞİLDİ, öğeler `option` değildi:
   *     ekran okuyucu "5 seçenekli liste" diye duyurmuyordu.
   *  2. Ok tuşu YOKTU: listeye yalnız Tab'la, öğe öğe girilebiliyordu.
   *  3. Liste **120 ms'lik bir blur zamanlayıcısıyla** kapanıyordu. Bu bir
   *     YARIŞTIR: odağın nereye gittiğine değil, saate bağlıydı. Yavaş bir
   *     makinede tıklama zamanlayıcıdan sonra gelir ve seçim kaybolur.
   *
   * Zamanlayıcı kaldırıldı; kapanma artık ODAĞIN NEREDE OLDUĞUNA bakıyor
   * (kökün `onBlur`unda `relatedTarget`). Ölçülebilir bir olgu, tahmin
   * edilen bir süre değil.
   */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const canOpen = !query && history.length > 0;
    const last = history.length - 1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showHistory && canOpen) return setHistoryOpen(true);
      if (showHistory) setActive((i) => (i >= last ? 0 : i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!showHistory && canOpen) {
        setHistoryOpen(true);
        return setActive(last);
      }
      if (showHistory) setActive((i) => (i <= 0 ? last : i - 1));
      return;
    }
    if (e.key === "Home" && showHistory) {
      e.preventDefault();
      return setActive(0);
    }
    if (e.key === "End" && showHistory) {
      e.preventDefault();
      return setActive(last);
    }
    if (e.key === "Enter") {
      /* İmleç bir geçmiş öğesindeyse ONU gönder, kutudaki metni değil. */
      return commit(showHistory && active >= 0 ? history[active]! : query);
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      /* ARIA combobox kalıbı: ilk Escape LİSTEYİ kapatır, ikinci Escape
         metni siler. Tek adımda ikisini birden yapmak, yalnızca listeyi
         kapatmak isteyen kullanıcının yazdığını da silerdi. */
      if (showHistory) {
        setHistoryOpen(false);
        return setActive(-1);
      }
      setQuery("");
    }
  };

  return (
    <div
      className="relative"
      /* Kapanma ODAĞA bağlı: odak kökün DIŞINA çıktıysa kapat. Odak
         listedeki bir öğeye geçtiyse `relatedTarget` hâlâ kökün içindedir
         ve liste açık kalır — zamanlayıcının çözemediği tam olarak buydu. */
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHistoryOpen(false);
          setActive(-1);
        }
      }}
    >
      <div className="flex h-10 items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-line-focus">
        {searching ? (
          <Loader2 className="h-4 w-4 animate-spin text-icon" aria-hidden />
        ) : (
          <SearchIcon className="h-4 w-4 text-icon" aria-hidden />
        )}

        <input
          ref={inputRef}
          type="search"
          /* `searchbox` → `combobox`: bu kutu bir listeyi AÇIP KAPATIYOR
             ve içinde bir imleç geziyor. Rolü değiştirmeden `aria-expanded`
             ve `aria-activedescendant` yazmak, ekran okuyucuya anlamadığı
             bir sözleşme vermek olurdu. */
          role="combobox"
          aria-expanded={showHistory}
          aria-controls={showHistory ? listId : undefined}
          aria-activedescendant={
            showHistory && active >= 0 ? optionId(active) : undefined
          }
          value={query}
          disabled={disabled}
          aria-label={label}
          aria-busy={searching || undefined}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
          }}
          onFocus={() => setHistoryOpen(true)}
          onKeyDown={onKeyDown}
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
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 w-full overflow-hidden rounded-sm border border-line bg-surface-floating shadow-e3"
          aria-label="Son aramalar"
        >
          {history.map((h, i) => (
            /* Öğeler `role="option"` ve ODAK ALMAZ: odak kutuda kalır,
               imleç `aria-activedescendant` ile taşınır (ARIA combobox
               kalıbı). Odağı listeye taşımak, yazmaya devam etmeyi
               imkânsız kılardı. */
            <li
              key={h}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => commit(h)}
              className={[
                "cursor-pointer truncate px-3 py-2 text-sm",
                i === active
                  ? "bg-surface-elevated text-content"
                  : "text-content-secondary",
              ].join(" ")}
            >
              {h}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
