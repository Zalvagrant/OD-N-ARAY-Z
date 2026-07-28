"use client";

/**
 * Top Header — Executive Command Bar.
 * Kaynak: 04-navigation-system.md §8 (UI-ADR-076), §5 (bağlam zinciri),
 *         03-information-architecture.md §15 (Universe switcher, UI-ADR-073)
 *
 * Sağda EN FAZLA 4 görünür ikon: Alerts · Tasks · AI Status · Profile.
 * Kalanlar "More" menüsünde. Weather ve Time YOK — karar üretmiyorlar.
 *
 * ANTI-FAKE: Mission, Universe ve AI Pulse'ın veri kaynağı henüz bağlı
 * değil. Uydurma değer yerine NoData gösterilir, AI Pulse animasyon almaz.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ListTodo,
  MoreHorizontal,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import { activePulseChannels } from "@/lib/telemetry/registry";
import { useUiStore } from "@/lib/store/ui";
import { NoData } from "@/components/ui/no-data";

export interface Crumb {
  label: string;
  href?: string;
}

const MORE_ITEMS = ["Notifications", "Messages", "System Health"];

function HeaderIconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="rounded-sm p-2 text-icon transition-colors duration-fast ease-standard hover:bg-surface hover:text-icon-active"
    >
      {children}
    </button>
  );
}

export function TopHeader({ crumbs }: { crumbs: Crumb[] }) {
  const setCommandPalette = useUiStore((s) => s.setCommandPalette);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moreOpen]);

  /* 3 kanal açık ama henüz ölçüm yok — bu yüzden nabız çizilmiyor. */
  const pulseChannels = activePulseChannels();

  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b border-line bg-bg-secondary px-4">
      {/* SOL */}
      <div className="flex shrink-0 items-center gap-4">
        <Link href="/briefing" className="flex items-center gap-2">
          <span className="text-md font-semibold tracking-tight text-content">
            ODIN
          </span>
        </Link>

        <div className="hidden items-center gap-2 text-sm lg:flex">
          <span className="text-content-tertiary">Mission</span>
          <NoData reason="Aktif mission verisi bağlı değil" />
        </div>

        <div className="hidden items-center gap-2 text-sm lg:flex">
          <span className="text-content-tertiary">Mode</span>
          <span className="text-content-secondary">Executive</span>
        </div>

        <button
          type="button"
          disabled
          title="Universe seçici: backend'de universe_id boyutu yok (13-backend-recommendations.md §2)"
          className="flex items-center gap-2 rounded-sm border border-line px-3 py-1 text-sm text-content-tertiary opacity-40"
        >
          Universe
          <NoData reason="universe_id backend'de tanımlı değil" />
          <ChevronDown className="h-3 w-3" aria-hidden />
        </button>
      </div>

      {/* ORTA — bağlam zinciri + Neural Search + AI Pulse */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <nav aria-label="Bağlam zinciri" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-2 text-sm">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-2">
                {i > 0 && <span className="text-content-tertiary">/</span>}
                {c.href ? (
                  <Link
                    href={c.href}
                    className="truncate text-content-secondary hover:text-content"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate text-content-tertiary">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <button
          type="button"
          onClick={() => setCommandPalette(true)}
          className="flex items-center gap-2 rounded-sm border border-line bg-surface px-3 py-1 text-sm text-content-tertiary hover:border-line-focus hover:text-content-secondary"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="hidden md:inline">Neural Search</span>
          <kbd className="odin-mono hidden rounded-xs border border-line px-1 text-xs md:inline">
            Ctrl K
          </kbd>
        </button>

        <div
          className="hidden items-center gap-2 rounded-sm border border-line px-3 py-1 text-sm xl:flex"
          title={`AI Pulse — açık kanallar: ${pulseChannels
            .map((c) => c.label)
            .join(", ")}. Ölçüm kaynağı S9'da bağlanacak.`}
        >
          <Sparkles className="h-4 w-4 text-ai" aria-hidden />
          <span className="text-content-tertiary">AI Pulse</span>
          <NoData reason="AI Gateway bağlı değil (S9)" />
        </div>
      </div>

      {/* SAĞ — 4 ikon + More */}
      <div className="flex shrink-0 items-center gap-1">
        <HeaderIconButton label="Alerts">
          <Bell className="h-4 w-4" aria-hidden />
        </HeaderIconButton>
        <HeaderIconButton label="Tasks">
          <ListTodo className="h-4 w-4" aria-hidden />
        </HeaderIconButton>
        <HeaderIconButton label="AI Status">
          <Sparkles className="h-4 w-4" aria-hidden />
        </HeaderIconButton>
        <HeaderIconButton label="Profile">
          <User className="h-4 w-4" aria-hidden />
        </HeaderIconButton>

        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            aria-label="Diğer"
            title="Diğer"
            className="rounded-sm p-2 text-icon hover:bg-surface hover:text-icon-active"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>

          {moreOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-2 w-48 rounded-md bg-surface-floating p-1 shadow-overlay"
            >
              {MORE_ITEMS.map((label) => (
                <div
                  key={label}
                  role="menuitem"
                  className="flex items-center justify-between rounded-sm px-3 py-2 text-sm text-content-secondary"
                >
                  {label}
                  <NoData reason="Veri kaynağı bağlı değil" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
