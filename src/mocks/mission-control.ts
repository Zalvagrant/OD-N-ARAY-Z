/**
 * Mission Control mock verisi — 05-dashboard.md §5.
 *
 * ⚠️ `Mission` EMEKLİ (ODIN ADR-0132 · UI-ADR-107): tahta artık ODIN'in
 * gerçek Goal yayınıyla beslenir — `{id, level, label, target, progress_pct}`
 * birebir. Eski Mission alanları (status · ownerDirector · deadline ·
 * relatedDecisionId · blockedReason) kaynaksızdı; mock'ta da YOKLAR.
 * "Upcoming Deadlines" bölümü bu yüzden veri alamaz ve ekranda gerekçeli
 * boş durum gösterir — termin uydurulmaz.
 *
 * `level` değerleri ODIN'de serbest metindir (ör. "urgent"); kolonlar bu
 * gerçek alandan türer.
 */

import type { DataEnvelope } from "@/types/data-envelope";
import type { Goal } from "@/types/screens";
import { ago, mockEnvelope } from "./envelope";

export function goalsMock(): DataEnvelope<Goal[]> {
  return mockEnvelope(
    [
      {
        id: "g-ppc",
        level: "urgent",
        label: "PPC verimliliğini toparla",
        target: "ACOS 30 gün içinde %16 altına",
        progressPct: 42,
      },
      {
        id: "g-stock",
        level: "urgent",
        label: "SKU-1042 tükenmesini önle",
        target: "Stoksuz gün sayısı 0",
        progressPct: 15,
      },
      {
        id: "g-fx",
        level: "quarter",
        label: "Kur riskini sınırla",
        target: "İthalat birim maliyeti öngörülebilir",
        /* İlerleme ölçülmüyor: pozisyon kapama kısmi ve süreklidir.
           "%0" yazmak yanlış olurdu — bilinmiyor. goals.alignment()'ın
           nötr 50'si de buraya SIZAMAZ (ADR-0132 tuzağı). */
        progressPct: null,
      },
      {
        id: "g-listing",
        level: "quarter",
        label: "Listeleme kalitesini yükselt",
        target: "Organik trafik 60 günde +%10",
        progressPct: 0,
      },
      {
        id: "g-cash",
        level: "annual",
        label: "Nakit tamponunu 30 güne çıkar",
        target: "Ödeme sıkışıklığı ortadan kalksın",
        progressPct: 68,
      },
      {
        id: "g-return",
        level: "annual",
        label: "İade politikası güncellemesi",
        /* Hedef ifadesi yayınlanmamış — uydurulmaz, satır çizilmez. */
        target: null,
        progressPct: 100,
      },
    ] satisfies Goal[],
    { lastUpdated: ago(6 * 60_000) }
  );
}
