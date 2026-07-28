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
 * Eşikler (07-...md §11 AI Body Language — yüksek güven yeşil, düşük amber):
 *   ≥80 success · ≥50 warning · <50 danger
 * Sayı her zaman yazılır; renk tek başına anlam taşımaz.
 */

import { Badge } from "@/components/ui/badge";
import { canShowConfidence, type DataMeta } from "@/types/data-envelope";

export const CONFIDENCE_HIGH = 80;
export const CONFIDENCE_LOW = 50;

function toneFor(v: number) {
  if (v >= CONFIDENCE_HIGH) return "success" as const;
  if (v >= CONFIDENCE_LOW) return "warning" as const;
  return "danger" as const;
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
  return (
    <Badge variant={toneFor(v)} size={size}>
      <span className="sr-only">{label}: </span>
      {v}%
    </Badge>
  );
}
