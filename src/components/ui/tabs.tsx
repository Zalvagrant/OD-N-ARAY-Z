"use client";

/**
 * Tabs — workspace header sekmeleri (UI-ADR-072).
 *
 * Kontrollü bileşendir: aktif sekme dışarıdan gelir. Gerekçe: sekme çoğu
 * zaman route'un bir parçasıdır ve navigation store tek kaynaktır
 * (04-navigation-system.md). Bileşen kendi içinde route state tutmaz.
 *
 * Klavye: ← → ile sekme değişir, Home/End uçlara gider (WAI-ARIA tabs).
 * Aktif sekme yalnızca renkle değil ALT ÇİZGİ ile de işaretlenir.
 *
 * Desteklenmeyen durumlar: Empty / ReadOnly / Offline — sekme çubuğu boşsa
 * render edilmez; sekmenin içeriği kendi durumunu gösterir.
 */

import { useRef, type ReactNode } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  disabled?: boolean;
  /** Sağda küçük sayaç. Bilinmiyorsa VERİLMEZ — sıfır uydurulmaz. */
  count?: number;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className = "",
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  if (items.length === 0) return null;

  const enabled = items.filter((i) => !i.disabled);

  const go = (target: TabItem<T> | undefined) => {
    if (!target) return;
    onChange(target.id);
    refs.current[target.id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex items-center gap-1 border-b border-line ${className}`}
      onKeyDown={(e) => {
        const i = enabled.findIndex((t) => t.id === value);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(enabled[(i + 1) % enabled.length]);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(enabled[(i - 1 + enabled.length) % enabled.length]);
        } else if (e.key === "Home") {
          e.preventDefault();
          go(enabled[0]);
        } else if (e.key === "End") {
          e.preventDefault();
          go(enabled[enabled.length - 1]);
        }
      }}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[item.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={active}
            aria-controls={`tabpanel-${item.id}`}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={[
              "flex h-10 items-center gap-2 border-b-2 px-4 text-base",
              "transition-colors duration-fast ease-standard",
              "disabled:cursor-not-allowed disabled:opacity-40",
              active
                ? "border-ai font-medium text-content"
                : "border-transparent text-content-secondary hover:text-content",
            ].join(" ")}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="odin-num text-xs text-content-tertiary">
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
}: {
  id: string;
  active: boolean;
  children: ReactNode;
}) {
  if (!active) return null;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
