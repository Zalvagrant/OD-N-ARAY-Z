/**
 * ConfidenceBreakdown — güven skorunun 8 kanonik bileşeni (UI-ADR-099).
 *
 * ODIN "kara kutu sayı yok" der (şema açıklaması) ve breakdown'ı ZORUNLU
 * üretir; UI-ADR-098'e kadar arayüz bunu hiç göstermiyordu — "Explainable
 * AI" kuralının doğrudan ihlaliydi. Bu bileşen o kaybı kapatır.
 *
 * Negatif yönlü bileşenler (risk_level, missing_information,
 * decision_complexity) işaretlenir: değeri YÜKSELDİKÇE güven DÜŞER.
 * Ağırlıklar odin/trust.py CONFIDENCE_COMPONENTS'ten (20/20/15/10/15/10/5/5).
 *
 * İç yardımcıdır (10b §0.3) — envantere girmez; AIRecommendationView
 * açılır bölümünde yaşar.
 */

import type { OdinConfidenceBreakdown } from "@/types/odin";
import { Meter } from "./meter";

const COMPONENTS: {
  key: keyof OdinConfidenceBreakdown;
  label: string;
  weight: number;
  negative?: boolean;
}[] = [
  { key: "knowledge_coverage", label: "Bilgi kapsamı", weight: 20 },
  { key: "evidence_strength", label: "Kanıt gücü", weight: 20 },
  { key: "expert_agreement", label: "Uzman mutabakatı", weight: 15 },
  { key: "model_agreement", label: "Model mutabakatı", weight: 10 },
  { key: "historical_success", label: "Geçmiş başarı", weight: 15 },
  { key: "risk_level", label: "Risk seviyesi", weight: 10, negative: true },
  { key: "missing_information", label: "Eksik bilgi", weight: 5, negative: true },
  { key: "decision_complexity", label: "Karar karmaşıklığı", weight: 5, negative: true },
];

export function ConfidenceBreakdown({
  breakdown,
}: {
  breakdown: OdinConfidenceBreakdown;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-content-tertiary">
        Güven dökümü
        <span className="ml-2 normal-case tracking-normal">
          (▼ işaretli bileşen yükseldikçe güven düşer)
        </span>
      </p>
      <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 [&>div]:min-w-0">
        {COMPONENTS.map((c) => {
          const v = breakdown[c.key];
          return (
            <div key={c.key} className="flex items-baseline justify-between gap-3">
              <dt className="min-w-0 truncate text-content-secondary">
                {c.negative && (
                  <span aria-hidden="true" className="mr-1 text-warning">
                    ▼
                  </span>
                )}
                {c.label}
                <span className="ml-1 text-xs text-content-tertiary">
                  ·A{" "}%{c.weight}
                </span>
                {c.negative && <span className="sr-only"> (negatif yönlü)</span>}
              </dt>
              <dd className="flex shrink-0 items-center gap-2">
                <Meter
                  value={v}
                  label={`${c.label}: ${Math.round(v)}`}
                  tone={c.negative ? "warning" : "ai"}
                />
                <span className="odin-num text-xs text-content-secondary">
                  {Math.round(v)}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
