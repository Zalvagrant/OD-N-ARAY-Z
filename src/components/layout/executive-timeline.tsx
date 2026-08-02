"use client";

/**
 * Executive Timeline — workspace altındaki yatay şerit.
 * Kaynak: 03-information-architecture.md §16 · UI-ADR-193
 *
 * CANLI — `/api/state.timeline` (`useOdinTimeline`, intelligence-feed ile
 * aynı 40 olaylık pencere). Şerit pencerenin SON olaylarını KRONOLOJİK
 * basar; ton, öncelik ve "yönetici olayı" seçkisi ODIN'de yayınlanmıyor ve
 * burada uydurulmaz (UI-ADR-111). Olay adı kaydın gerçek adıdır, çevrilmez.
 */

import { useOdinTimeline } from "@/lib/data/odin-state";
import { formatDate } from "@/lib/format/date";

/** Şeride sığan olay sayısı — görsel kapasite, veri hükmü değil. */
const STRIP_CAPACITY = 5;

export function ExecutiveTimeline() {
  const { envelope, error, loading } = useOdinTimeline();
  /* API sırası (kronolojik) korunur; yalnız pencerenin sonu alınır. */
  const events = (envelope?.data ?? []).slice(-STRIP_CAPACITY);

  return (
    <div
      className="flex h-10 shrink-0 items-center gap-4 border-t border-line bg-bg px-4 text-sm"
      aria-label="Executive Timeline"
    >
      <span className="shrink-0 text-xs uppercase tracking-wide text-content-tertiary">
        Timeline
      </span>
      {loading ? (
        <span className="truncate text-content-tertiary">
          Olay akışı yükleniyor…
        </span>
      ) : error ? (
        /* Sebep gizlenmez: `classifyError` metni kaynağı söylüyor. */
        <span role="note" className="truncate text-content-tertiary">
          Olay akışı okunamadı — {error.message}
        </span>
      ) : events.length === 0 ? (
        /* "Ölçüldü, sonuç boş" hâli — pencere gerçekten boş. */
        <span className="truncate text-content-tertiary">Kayıtlı olay yok.</span>
      ) : (
        <ol className="flex min-w-0 items-center gap-4 overflow-hidden">
          {events.map((e) => (
            <li key={e.id} className="flex min-w-0 shrink items-center gap-1.5">
              <span className="shrink-0 tabular-nums text-content-tertiary">
                {formatDate(e.at, { hour: "2-digit", minute: "2-digit" }) ?? "—"}
              </span>
              <span className="truncate text-content-secondary">{e.title}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
