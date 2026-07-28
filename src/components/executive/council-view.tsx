"use client";

/**
 * CouncilView + ConsensusIndicator — 07-ai-directors.md §4–§6.
 *
 * "Çoğu AI sistemi sana cevabı gösterir. ODIN sana düşünce sürecini
 * gösterir — ama sadece istediğinde." Bu yüzden Council bir ekran değil,
 * karar kartından açılan bir bölümdür.
 *
 * ConsensusIndicator beş göstergeyi birlikte verir:
 *   Consensus · Disagreement · Evidence Quality · Financial Risk
 *   · Execution Complexity
 * CEO artık sadece "doğru mu?" değil, "AI'lar ne kadar hemfikir?" sorusunu
 * da görür.
 *
 * ANTI-FAKE:
 *  - Ölçülmemiş bir yüzde meter olarak çizilmez (Meter → NoData).
 *  - Consensus + Disagreement toplamı 100 varsayılmaz; ikisi ayrı ölçümdür,
 *    biri diğerinden TÜRETİLMEZ.
 *  - Görüş listesi boşsa "hemfikir" denmez; kurul toplanmamıştır.
 */

import type { Decision, DirectorOpinion } from "@/types/executive";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "./meter";
import { ConfidenceBadge } from "./confidence-badge";
import { MinorityOpinionBanner } from "./minority-opinion-banner";

const POSITION = {
  support: { glyph: "＋", label: "Destekliyor", cls: "border-success text-success" },
  oppose: { glyph: "－", label: "Karşı", cls: "border-danger text-danger" },
  neutral: { glyph: "＝", label: "Nötr", cls: "border-line text-content-tertiary" },
} as const;

const LEVEL_TONE = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",
} as const;

const LEVEL_LABEL = { low: "Düşük", medium: "Orta", high: "Yüksek", critical: "Kritik" } as const;

export function ConsensusIndicator({
  consensus,
  disagreement,
  evidenceQuality,
  financialRisk,
  executionComplexity,
}: {
  consensus: number | null | undefined;
  disagreement: number | null | undefined;
  evidenceQuality: number | null | undefined;
  financialRisk: keyof typeof LEVEL_LABEL | null | undefined;
  executionComplexity: keyof typeof LEVEL_LABEL | null | undefined;
}) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
      <div>
        <dt className="text-xs text-content-tertiary">Consensus</dt>
        <dd className="mt-1 flex items-center gap-2">
          <Meter value={consensus} label="Uzlaşma" tone="success" noDataReason="Uzlaşma ölçülmedi" />
          {Number.isFinite(consensus) && <span>{Math.round(consensus!)}%</span>}
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
          {Number.isFinite(disagreement) && <span>{Math.round(disagreement!)}%</span>}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-content-tertiary">Evidence Quality</dt>
        <dd className="mt-1 flex items-center gap-2">
          <Meter
            value={evidenceQuality}
            label="Kanıt kalitesi"
            tone="ai"
            noDataReason="Kanıt kalitesi ölçülmedi"
          />
          {Number.isFinite(evidenceQuality) && <span>{Math.round(evidenceQuality!)}%</span>}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-content-tertiary">Financial Risk</dt>
        <dd className="mt-1">
          {financialRisk ? (
            <Badge variant={LEVEL_TONE[financialRisk]} size="sm">
              {LEVEL_LABEL[financialRisk]}
            </Badge>
          ) : (
            <Text size="sm" tone="tertiary">
              ölçülmedi
            </Text>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-content-tertiary">Execution Complexity</dt>
        <dd className="mt-1">
          {executionComplexity ? (
            <Badge variant={LEVEL_TONE[executionComplexity]} size="sm">
              {LEVEL_LABEL[executionComplexity]}
            </Badge>
          ) : (
            <Text size="sm" tone="tertiary">
              ölçülmedi
            </Text>
          )}
        </dd>
      </div>
    </dl>
  );
}

function OpinionRow({ opinion }: { opinion: DirectorOpinion }) {
  const pos = POSITION[opinion.position] ?? POSITION.neutral;
  return (
    <li className={`border-l-2 pl-3 ${pos.cls}`}>
      <p className="flex flex-wrap items-center gap-2">
        <span aria-hidden="true">{pos.glyph}</span>
        <span className="sr-only">{pos.label}: </span>
        <span className="text-content">{opinion.directorId}</span>
        <ConfidenceBadge value={opinion.confidence} size="xs" />
        {opinion.evidence?.length > 0 && (
          <span className="text-xs text-content-tertiary">{opinion.evidence.length} kanıt</span>
        )}
      </p>
      <Text size="sm" tone="secondary">
        {opinion.argument}
      </Text>
    </li>
  );
}

/**
 * Decision'ın kurul kısmı. Zarf doğrulaması çağıranda (DecisionCard) yapılır;
 * bu bileşen kartın içinde yaşar, tek başına bir veri bileşeni değildir.
 */
export function CouncilView({ decision }: { decision: Decision }) {
  const opinions = decision.directorOpinions ?? [];

  return (
    <section aria-label="Executive Council" className="flex flex-col gap-4">
      <ConsensusIndicator
        consensus={decision.consensus}
        disagreement={decision.disagreement}
        evidenceQuality={decision.evidenceQuality}
        financialRisk={decision.riskLevel}
        executionComplexity={decision.executionComplexity}
      />

      {opinions.length ? (
        <ul className="flex flex-col gap-3">
          {opinions.map((o) => (
            <OpinionRow key={o.directorId} opinion={o} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Kurul henüz toplanmadı"
          description="Bu karar için Director görüşü kaydedilmemiş."
          suggestion="Görüş yokluğu uzlaşma anlamına gelmez."
          nextStep="Decision Center'dan kurul çalıştırın."
        />
      )}

      <MinorityOpinionBanner opinion={decision.minorityOpinion} />
    </section>
  );
}
