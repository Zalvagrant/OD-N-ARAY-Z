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
 * DEĞİLDİR (`onSelect` verilmedikçe). Verildiğinde satır `Pressable`a
 * sarılır: `role="button"` + `tabIndex` + Enter/Space. Native `<button>`
 * KULLANILMAZ çünkü satır gövdesi blok içeriktir ve `<button>`ın içerik
 * modeli phrasing content'tir (UI-ADR-132).
 */


import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format/date";
import { LoadingState } from "@/components/ui/loading-state";
import { NoData } from "@/components/ui/no-data";
import { Pressable } from "@/components/ui/pressable";
import type { TimelineItem } from "@/types/screens";

export type { TimelineItem };

const TONE = {
  neutral: { dot: "bg-icon-muted", glyph: "○" },
  ai: { dot: "bg-ai", glyph: "◆" },
  success: { dot: "bg-success", glyph: "✓" },
  warning: { dot: "bg-warning", glyph: "▲" },
  danger: { dot: "bg-danger", glyph: "▲" },
  info: { dot: "bg-info", glyph: "i" },
} as const;

/**
 * Tıklanabilir satırın ERİŞİLEBİLİR ADI — UI-ADR-161.
 *
 * Önce `item.actor ? \`${actor}: ${id}\` : id` idi ve ekran okuyucuda
 * **"evt-4821, buton"** diye okunuyordu: kullanıcı neye tıkladığını
 * bilmiyordu. (`alert-stack.tsx` aynı işi başlıkla yapıyor.)
 *
 * `title` tipçe `ReactNode` — düğüm olduğunda ondan güvenli bir ad
 * çıkarılamaz; o hâlde kimliğe düşülür ama "Olay" önekiyle, çünkü çıplak
 * bir kimlik hiçbir şey söylemez.
 */
function erisilebilirAd(item: TimelineItem): string {
  const baslik = typeof item.title === "string" ? item.title : null;
  const govde = baslik ?? `Olay ${item.id}`;
  return item.actor ? `${item.actor}: ${govde}` : govde;
}

function formatTime(iso: string): string {
  /* Tek doğrulama noktası — UI-ADR-158. Bu dosya geçerliliği ZATEN
     kontrol ediyordu; iki kardeşi (kpi kartı, sku paneli) etmiyordu.
     Üçü de aynı yardımcıya bağlandı ki bir daha ayrışmasınlar. */
  return (
    formatDate(iso, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }) ?? ""
  );
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
        /* Bilinmeyen ton nötre düşer — çökmez (UI-ADR-156). */
        const tone = TONE[item.tone ?? "neutral"] ?? TONE.neutral;
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
                {/* KIRPILMAZ, sarar. `truncate` idi ve 1024 px'te olay
                    başlıklarının sonunu 100 px'e kadar yiyordu ("Karar
                    onaylandı — iade politikası günce…"). Bir olayın NE
                    olduğu başlığının sonundadır; kırpmak bilgiyi siler.
                    Aynı düzeltme `CardHeader`'da da yapıldı (10c §7.5). */}
                <span className="break-words text-base text-content">
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
              <Pressable
                onPress={() => onSelect(item)}
                /* Ad KİMLİK değil BAŞLIK — UI-ADR-161. "evt-4821, buton"
                   diye okunan bir satır ekran okuyucuda hiçbir şey
                   söylemez; kullanıcı neye tıkladığını bilmez.
                   (`alert-stack.tsx` bunu zaten doğru yapıyor.) */
                label={erisilebilirAd(item)}
                className="w-full hover:bg-surface"
              >
                {body}
              </Pressable>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ol>
  );
}
