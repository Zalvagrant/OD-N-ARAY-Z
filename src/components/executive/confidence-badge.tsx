/**
 * ConfidenceBadge — AI güven skoru.
 *
 * EN ÖNEMLİ KURAL: skor ÜRETİLMEMİŞSE badge HİÇ GÖRÜNMEZ (`null` döner).
 * "Confidence —" yazmak bile yanlıştır: kullanıcı orada bir skor bekler.
 * Kaynak: 13-backend-recommendations.md §9, `canShowConfidence()`.
 *
 * İki kullanım:
 *   <ConfidenceBadge meta={meta} />   → zarf seviyesinde (canShowConfidence)
 *   <ConfidenceBadge value={n} />     → alan seviyesinde (kpi.confidence vb.)
 *
 * EŞİKLER KANONİKTİR, UI KARARI DEĞİLDİR (UI-ADR-098 / 09b §2).
 * ODIN `odin/trust.py::CONFIDENCE_LEVELS` beş bant tanımlar:
 *
 *   ≥80 very-high · ≥60 high · ≥40 moderate · ≥20 low · ≥0 very-low
 *
 * S4'te 80/50 kullanılmıştı; **50 bandının ODIN'de karşılığı yoktur**,
 * uydurulmuş bir eşikti. 13-...md §13.3'teki "kalibrasyon sorusu" böylece
 * cevaplandı: soru kalibrasyon değil, kanonik kaynağı okumamaktı.
 *
 * Beş bant üç renge indirilir (Badge'in anlamlı üç durumu var):
 *   very-high/high → success · moderate → warning · low/very-low → danger
 * Bant ADI `sr-only` metinde yazılır — renk tek başına anlam taşımaz ve
 * kullanıcı hangi kanonik banda düştüğünü okuyabilir.
 */

import { Badge } from "@/components/ui/badge";
import { canShowConfidence, type DataMeta } from "@/types/data-envelope";

/** `odin/trust.py::CONFIDENCE_LEVELS` — sıra: yüksekten düşüğe. */
export const CONFIDENCE_LEVELS = [
  { min: 80, id: "very-high", label: "çok yüksek", tone: "success" },
  { min: 60, id: "high", label: "yüksek", tone: "success" },
  { min: 40, id: "moderate", label: "orta", tone: "warning" },
  { min: 20, id: "low", label: "düşük", tone: "danger" },
  { min: 0, id: "very-low", label: "çok düşük", tone: "danger" },
] as const;

export function confidenceLevel(v: number) {
  return CONFIDENCE_LEVELS.find((l) => v >= l.min) ?? CONFIDENCE_LEVELS[4];
}

export function ConfidenceBadge({
  value,
  meta,
  label = "Güven",
  size = "sm",
}: {
  value?: number | null;
  meta?: DataMeta;
  label?: string;
  size?: "xs" | "sm" | "md";
}) {
  const score = meta ? (canShowConfidence(meta) ? meta.confidence : undefined) : value;

  /* Anti-fake: üretilmemiş skor gösterilmez. */
  if (score === null || score === undefined || !Number.isFinite(score)) return null;

  const v = Math.round(score);
  const level = confidenceLevel(v);
  return (
    <Badge variant={level.tone} size={size}>
      <span className="sr-only">{label}: </span>
      {v}%
      <span className="sr-only"> — {level.label}</span>
    </Badge>
  );
}
