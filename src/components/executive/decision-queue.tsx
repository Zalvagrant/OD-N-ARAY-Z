"use client";

/**
 * DecisionQueue — 10-component-library.md §10 envanterindeki kalem.
 * Kaynak: 05-dashboard.md §3.2 + 02-design-principles.md §3 (Executive Focus)
 *
 * Kartın kendisini YENİDEN YAZMAZ; DecisionCard'ı sıralar ve sınırlar.
 *
 * NEDEN SINIR VAR: "Bir ekranda aynı anda 1 ana karar öne çıkar" (§3) ve
 * Attention Economy en fazla 3 primary kart der. Kuyrukta 12 karar olsa bile
 * brifingde ilk `limit` tanesi görünür; gerisi SAKLANMAZ, sayısı yazılır ve
 * Decision Center'a yönlendirilir. Bastırmayı bilen katman bastırmayı yazar
 * (UI-ADR-091 ile aynı ilke).
 *
 * SIRALAMA: `priority` artan (1 = en yüksek), eşitlikte finansal etki büyük
 * olan önce. Türetilmiş bir "skor" ÜRETİLMEZ; ikisi de sözleşmede var.
 */

import type { Decision } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { DecisionCard } from "./decision-card";

export function sortDecisions(decisions: Decision[]): Decision[] {
  return [...decisions].sort(
    (a, b) =>
      a.priority - b.priority ||
      Math.abs(b.financialImpact?.amount ?? 0) - Math.abs(a.financialImpact?.amount ?? 0)
  );
}

function QueueView({
  decisions,
  meta,
  limit,
  onApprove,
  onOpenAnalysis,
}: {
  decisions: Decision[];
  meta: DataMeta;
  limit: number;
  onApprove?: (d: Decision) => void;
  onOpenAnalysis?: (d: Decision) => void;
}) {
  if (decisions.length === 0) {
    return (
      <EmptyState
        title="Bekleyen karar yok"
        description="Kurul şu an onayına sunulmuş bir karar üretmedi."
        suggestion="Yeni kanıt geldikçe kararlar burada öncelik sırasıyla belirir."
      />
    );
  }

  const sorted = sortDecisions(decisions);
  const shown = sorted.slice(0, limit);
  const hidden = sorted.length - shown.length;

  return (
    <div className="flex flex-col gap-4">
      {shown.map((d) => (
        <DecisionCard
          key={d.id}
          env={{ data: d, meta }}
          onApprove={onApprove}
          onOpenAnalysis={onOpenAnalysis}
        />
      ))}

      {hidden > 0 && (
        <Text size="sm" tone="tertiary">
          {hidden}{" "}
          karar daha bekliyor — dikkat bütçesi nedeniyle burada gösterilmiyor.
          Tamamı Decision Center&apos;da.
        </Text>
      )}
    </div>
  );
}

export function DecisionQueue({
  env,
  limit = 3,
  onApprove,
  onOpenAnalysis,
}: {
  env: DataEnvelope<Decision[]> | null | undefined;
  /** 02-design-principles.md §4: bir ekranda en fazla 3 primary kart. */
  limit?: number;
  onApprove?: (d: Decision) => void;
  onOpenAnalysis?: (d: Decision) => void;
}) {
  return (
    <DataGuard env={env} reason="Karar kuyruğu verisi yok">
      {(decisions, meta) => (
        <QueueView
          decisions={decisions}
          meta={meta}
          limit={limit}
          onApprove={onApprove}
          onOpenAnalysis={onOpenAnalysis}
        />
      )}
    </DataGuard>
  );
}
