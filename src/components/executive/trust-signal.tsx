"use client";

/**
 * TrustSignal — kaynak · güncellik · tazelik. HER veri bileşeninde zorunlu.
 *
 * Kaynak: 02-design-principles.md §8 Trust Signals, 09-...md §0.
 * Amaç: kullanıcı hiçbir zaman "bu bilgi güncel mi?" diye düşünmesin.
 *
 * Anti-fake:
 *  - Zaman metni ancak istemci saati geldikten sonra yazılır; "az önce"
 *    UYDURULMAZ (bkz. lib/clock/tick.ts).
 *  - Tazelik yalnızca renkle değil glyph ile de verilir (renk körü).
 */

import { useNow, relativeTime } from "@/lib/clock/tick";
import type { DataMeta, Freshness } from "@/types/data-envelope";

const SOURCE_LABEL: Record<DataMeta["source"], string> = {
  "sp-api": "Amazon SP-API",
  "ads-api": "Amazon Ads API",
  internal: "ODIN çekirdeği",
  ai: "AI üretimi",
  manual: "Elle girildi",
  computed: "Hesaplandı",
  /* UI-ADR-094 — gerçek veri değil. Kaynak satırı bunu SAKLAMAZ. */
  mock: "Mock veri (S8'de gerçek kaynakla değişecek)",
};

const FRESHNESS: Record<Freshness, { glyph: string; label: string; cls: string }> = {
  live: { glyph: "●", label: "canlı", cls: "text-success" },
  recent: { glyph: "◐", label: "yakın", cls: "text-content-secondary" },
  stale: { glyph: "○", label: "bayat", cls: "text-warning" },
};

export function TrustSignal({
  meta,
  refreshFailed,
  className = "",
}: {
  meta: DataMeta;
  /**
   * Son yenileme denemesi başarısızsa NEDENİ — UI-ADR-115 (S7).
   *
   * Bayatlık tek başına yetmez: "bayat" hafta sonu güncellenmemiş de
   * olabilir, ODIN üç saattir 500 dönüyor da olabilir. İkisi arasındaki
   * fark, o eski sayıya dayanarak karar verilip verilmeyeceğidir.
   */
  refreshFailed?: string;
  className?: string;
}) {
  const now = useNow();
  const age = relativeTime(meta.lastUpdated, now);
  const fresh = FRESHNESS[meta.freshness] ?? FRESHNESS.stale;

  return (
    <p className={`flex flex-wrap items-center gap-2 text-xs text-content-tertiary ${className}`}>
      <span className={fresh.cls}>
        <span aria-hidden="true">{fresh.glyph}</span>{" "}
        <span>{fresh.label}</span>
      </span>
      <span aria-hidden="true">·</span>
      <span>{SOURCE_LABEL[meta.source] ?? meta.source}</span>
      {age && (
        <>
          <span aria-hidden="true">·</span>
          <time dateTime={meta.lastUpdated}>{age}</time>
        </>
      )}
      {refreshFailed && (
        <>
          <span aria-hidden="true">·</span>
          {/* Renk tek gösterge değil: "başarısız" kelimesi de yazıyor. */}
          <span className="text-warning">
            <span aria-hidden="true">⚠</span> Son yenileme başarısız — {refreshFailed}
          </span>
        </>
      )}
    </p>
  );
}
