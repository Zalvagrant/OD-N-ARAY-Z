/**
 * Timeline — olay akışı (10-component-library.md §10 Data Display).
 *
 * Executive Timeline, Decision Timeline ve Knowledge Timeline aynı bileşeni
 * kullanır; yalnızca besleyen veri değişir (§2 tekrar yasağı).
 *
 * Anti-fake: zaman damgası yoksa "az önce" gibi bir ifade UYDURULMAZ,
 * NoData gösterilir. Sıralama çağıran katmanın sorumluluğudur — bileşen
 * verilen sırayı bozmaz.
 *
 * Renkten bağımsızlık: her tonun kendi glyph'i vardır.
 *
 * Desteklenmeyen durumlar: Hover / Pressed / Focus — öğeler tıklanabilir
 * DEĞİLDİR (`onSelect` verilmedikçe). Verildiğinde satır bir butona döner
 * ve odak halkası native gelir.
 */

import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { NoData } from "@/components/ui/no-data";

const TONE = {
  neutral: { dot: "bg-icon-muted", glyph: "○" },
  ai: { dot: "bg-ai", glyph: "◆" },
  success: { dot: "bg-success", glyph: "✓" },
  warning: { dot: "bg-warning", glyph: "▲" },
  danger: { dot: "bg-danger", glyph: "▲" },
  info: { dot: "bg-info", glyph: "i" },
} as const;

export interface TimelineItem {
  id: string;
  /** ISO 8601. Bilinmiyorsa null — tahmini zaman yazılmaz. */
  at: string | null;
  title: ReactNode;
  description?: ReactNode;
  tone?: keyof typeof TONE;
  /** Olayı kimin ürettiği: "Amazon Director", "Sen", "Sistem". */
  actor?: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function Timeline({
  items,
  loading = false,
  onSelect,
  emptyDescription = "Bu bağlamda henüz kayıtlı olay yok.",
}: {
  items: TimelineItem[];
  loading?: boolean;
  onSelect?: (item: TimelineItem) => void;
  emptyDescription?: string;
}) {
  if (loading) return <LoadingState layout="list" count={4} />;

  if (items.length === 0) {
    return (
      <EmptyState
        title="Olay yok"
        description={emptyDescription}
        suggestion="Kararlar, senkronizasyonlar ve AI çıktıları burada zaman sırasıyla birikir."
      />
    );
  }

  return (
    <ol className="relative flex flex-col">
      {items.map((item, i) => {
        const tone = TONE[item.tone ?? "neutral"];
        const last = i === items.length - 1;
        const body = (
          <div className="flex gap-3 pb-4">
            {/* Eksen: nokta + devam çizgisi */}
            <div className="relative flex w-4 shrink-0 justify-center">
              <span
                className={`z-10 mt-1 h-2 w-2 shrink-0 rounded-full ${tone.dot}`}
                aria-hidden
              />
              {!last && (
                <span
                  className="absolute top-2 h-full w-px bg-line"
                  aria-hidden
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-base text-content">
                  <span aria-hidden className="mr-1 text-content-tertiary">
                    {tone.glyph}
                  </span>
                  {item.title}
                </span>
                <span className="shrink-0 text-xs text-content-tertiary">
                  {item.at ? (
                    <time dateTime={item.at} className="odin-num">
                      {formatTime(item.at)}
                    </time>
                  ) : (
                    <NoData reason="Zaman damgası kaydedilmemiş" />
                  )}
                </span>
              </div>

              {item.description && (
                <p className="mt-1 text-sm text-content-secondary">
                  {item.description}
                </p>
              )}
              {item.actor && (
                <p className="mt-1 text-xs text-content-tertiary">{item.actor}</p>
              )}
            </div>
          </div>
        );

        return (
          <li key={item.id}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="w-full rounded-sm text-left hover:bg-surface"
              >
                {body}
              </button>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ol>
  );
}
