/**
 * ConfidenceBadge — AI güven skoru.
 *
 * EN ÖNEMLİ KURAL: skor ÜRETİLMEMİŞSE badge HİÇ GÖRÜNMEZ (`null` döner).
 * "Confidence —" yazmak bile yanlıştır: kullanıcı orada bir skor bekler.
 * Kaynak: 13-backend-recommendations.md §9, `canShowConfidence()`.
 *
 * BANTLAR ODIN'İN KANONİK BANTLARIDIR (odin/trust.py CONFIDENCE_LEVELS;
 * UI-ADR-099). Eski 80/50 eşiği UYDURMAYDI — 50'nin ODIN'de karşılığı yok.
 * Beş bandın beşinin de METİN ETİKETİ vardır; üç renk kullanılsa bile
 * etiket kanonik bandı söyler (renk tek başına anlam taşımaz).
 */

import { Badge } from "@/components/ui/badge";
import { odinConfidenceLevel, type OdinConfidenceLevel } from "@/types/odin";
import { canShowConfidence, type DataMeta } from "@/types/data-envelope";

const BAND: Record<
  OdinConfidenceLevel,
  { variant: "success" | "warning" | "danger"; label: string }
> = {
  "very-high": { variant: "success", label: "çok yüksek" },
  high: { variant: "success", label: "yüksek" },
  moderate: { variant: "warning", label: "orta" },
  low: { variant: "danger", label: "düşük" },
  "very-low": { variant: "danger", label: "çok düşük" },
};

export function ConfidenceBadge({
  value,
  meta,
  label = "Güven",
  size = "sm",
  showBandLabel = false,
}: {
  value?: number | null;
  meta?: DataMeta;
  label?: string;
  size?: "xs" | "sm" | "md";
  /** true → bant adı görünür metinde de yazılır ("%71 · yüksek"). */
  showBandLabel?: boolean;
}) {
  const score = meta ? (canShowConfidence(meta) ? meta.confidence : undefined) : value;

  /* Anti-fake: üretilmemiş skor gösterilmez. */
  if (score === null || score === undefined || !Number.isFinite(score)) return null;

  const band = BAND[odinConfidenceLevel(score)];
  const v = Math.round(score);
  return (
    <Badge variant={band.variant} size={size}>
      <span className="sr-only">
        {label} ({band.label}):{" "}
      </span>
      {v}%{showBandLabel && <span className="ml-1">· {band.label}</span>}
    </Badge>
  );
}
