"use client";

/**
 * CouncilView — 07-ai-directors.md §4–§6, kanonik sözleşme üzerine yeniden
 * yazıldı (UI-ADR-105).
 *
 * "Çoğu AI sistemi sana cevabı gösterir. ODIN sana düşünce sürecini
 * gösterir — ama sadece istediğinde." Bu yüzden Council bir ekran değil,
 * karar kartından açılan bir bölümdür.
 *
 * ⚙️ NE DEĞİŞTİ: eski sürüm `directorOpinions` · `evidenceQuality` ·
 * `executionComplexity` okuyordu; **üçünün de ODIN'de karşılığı yok**
 * (09b §1). Yerine ODIN'in gerçekten ürettiği üç şey gösteriliyor:
 * güven kırılımı · uzlaşma · alternatifler.
 *
 * 🔴 GÜVEN KIRILIMI EN ÖNEMLİ EKLENTİ. `odin/trust.py` güveni sekiz
 * ağırlıklı bileşenden hesaplıyor ve arayüz yalnızca sonucu gösteriyordu.
 * Skorun NEDEN o değer olduğunu saklamak, "Explainable AI" kuralının
 * doğrudan ihlaliydi.
 *
 * ANTI-FAKE:
 *  - Ölçülmemiş yüzde meter olarak çizilmez (Meter → NoData).
 *  - Disagreement TÜRETİLMİŞTİR (`100 − consensus`) ve bu ekranda yazar;
 *    eski metin "ikisi ayrı ölçümdür" diyordu, yanlıştı (09b §3).
 *  - Alternatif listesi boşsa "tek seçenek vardı" denmez.
 */

import type { Decision } from "@/types/executive";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "./meter";
import { MinorityOpinionBanner } from "./minority-opinion-banner";

const RISK_TONE = { low: "success", medium: "warning", high: "danger" } as const;
const RISK_LABEL = { low: "Düşük", medium: "Orta", high: "Yüksek" } as const;

export function ConsensusIndicator({
  consensus,
  disagreement,
}: {
  consensus: number | null | undefined;
  disagreement: number | null | undefined;
}) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-xs text-content-tertiary">Consensus</dt>
        <dd className="mt-1 flex items-center gap-2">
          <Meter value={consensus} label="Uzlaşma" tone="success" noDataReason="Uzlaşma ölçülmedi" />
          {Number.isFinite(consensus) && <span className="odin-num">{Math.round(consensus!)}%</span>}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-content-tertiary">Disagreement</dt>
        <dd className="mt-1 flex items-center gap-2">
          <Meter
            value={disagreement}
            label="Anlaşmazlık"
            tone="warning"
            noDataReason="Anlaşmazlık ölçülmedi"
          />
          {Number.isFinite(disagreement) && (
            <span className="odin-num">{Math.round(disagreement!)}%</span>
          )}
        </dd>
        {/* Türetilmiş olduğu SÖYLENİR: iki bağımsız ölçüm sanılmasın. */}
        <p className="text-xs text-content-tertiary">uzlaşmadan türetilir (100 − consensus)</p>
      </div>
    </dl>
  );
}

/** Güvenin sekiz bileşeni — skorun NEDEN o değer olduğu. */
function ConfidenceBreakdown({ decision }: { decision: Decision }) {
  const parts = decision.recommendation?.confidenceBreakdown ?? [];

  if (!parts.length) {
    return (
      <Text size="sm" tone="tertiary">
        Güven kırılımı üretilmedi — skorun neden o değerde olduğu bilinmiyor.
      </Text>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-content-tertiary">
        Güveni ne belirledi
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {parts.map((c) => (
          <li key={c.key} className="flex flex-wrap items-center gap-2">
            {/* Renkten bağımsız yön göstergesi. */}
            <span aria-hidden="true" className="text-content-tertiary">
              {c.direction === "positive" ? "▲" : "▼"}
            </span>
            <span className="sr-only">
              {c.direction === "positive" ? "olumlu" : "olumsuz"}:{" "}
            </span>
            <span className="min-w-0 flex-1 text-sm text-content-secondary">{c.label}</span>
            <Meter
              value={c.score}
              label={`${c.label} skoru`}
              tone={c.direction === "positive" ? "ai" : "warning"}
              noDataReason="ölçülmedi"
            />
            <span className="odin-num shrink-0 text-xs text-content-tertiary">
              ağırlık {c.weight}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Decision'ın kurul kısmı. Zarf doğrulaması çağıranda (DecisionCard) yapılır;
 * bu bileşen kartın içinde yaşar, tek başına bir veri bileşeni değildir.
 */
export function CouncilView({ decision }: { decision: Decision }) {
  const rec = decision.recommendation;
  /* Alternatifler KARARIN alanıdır, önerinin değil (09b §1). */
  const alternatives = decision.alternatives ?? [];

  return (
    <section aria-label="Executive Council" className="flex flex-col gap-4">
      <ConsensusIndicator
        consensus={rec?.consensusScore}
        disagreement={rec?.disagreementScore}
      />

      <ConfidenceBreakdown decision={decision} />

      <div>
        <p className="text-xs uppercase tracking-wide text-content-tertiary">
          Alternatifler
        </p>
        {alternatives.length ? (
          <ul className="mt-2 flex flex-col gap-3">
            {alternatives.map((a) => (
              <li key={a.title} className="border-l-2 border-line pl-3">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-content">{a.title}</span>
                  <Badge variant={RISK_TONE[a.risk] ?? "secondary"} size="xs">
                    {RISK_LABEL[a.risk] ?? a.risk}
                  </Badge>
                </p>
                <Text size="sm" tone="secondary">
                  {a.description}
                </Text>
                <Text size="sm" tone="tertiary">
                  Beklenen: {a.expectedOutcome}
                </Text>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Alternatif kaydedilmemiş"
            description="ODIN şeması en az iki alternatif zorunlu tutar; bu kayıtta yok."
            suggestion="Alternatifsiz bir karar, karşılaştırılmamış bir karardır."
          />
        )}
      </div>

      {rec?.minorityOpinions?.length ? (
        rec.minorityOpinions.map((o) => (
          <MinorityOpinionBanner key={`${o.member}-${o.option}`} opinion={o} />
        ))
      ) : (
        <Text size="sm" tone="tertiary">
          Azınlık görüşü kaydedilmedi. Bu, herkesin hemfikir olduğu anlamına
          gelmez — kurul toplanmamış da olabilir.
        </Text>
      )}
    </section>
  );
}
