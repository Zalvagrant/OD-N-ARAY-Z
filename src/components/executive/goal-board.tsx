"use client";

/**
 * GoalBoard — Mission Control'ün Primary Focus Area'sı
 * (03-information-architecture.md §5, 05-dashboard.md §5).
 *
 * ⚠️ MissionBoard'un halefi (ODIN ADR-0132 · UI-ADR-107): `Mission` tipi
 * Goal'e emekli edildi. Tahta ARTIK kanban değildir — kolonlar ODIN'in
 * GERÇEK `level` alanıyla gruplanır; icat edilmiş `status`
 * (planned/active/blocked/done) kaynaksızdı ve DÜŞTÜ. Kolon sırası verinin
 * kendi sırasıdır: ODIN seviye kümesini dondurmadığı için burada bir öncelik
 * sıralaması UYDURULMAZ.
 *
 * ANTI-FAKE:
 *  - `progressPct === null` → ilerleme çubuğu çizilmez, NoData çıkar.
 *    "%0" ile "ölçülmüyor" farklı şeylerdir. goals.alignment()'ın nötr 50'si
 *    de "ölçülmedi"dir — adaptör null'a çevirir, tahta %50 çizmez.
 *  - `target === null` → hedef satırı yazılmaz, uydurulmaz.
 *  - Termin/sorumlu/engel alanları YOK: ODIN yayınlamıyor, biz çizmiyoruz.
 */

import type { DataEnvelope } from "@/types/data-envelope";
import type { Goal } from "@/types/screens";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { Meter } from "./meter";
import { TrustSignal } from "./trust-signal";

function GoalItem({ goal }: { goal: Goal }) {
  return (
    <Card density="compact">
      <CardBody density="compact" className="flex flex-col gap-2">
        <p className="text-sm font-medium text-content">{goal.label}</p>
        {goal.target && (
          <Text size="sm" tone="secondary">
            Hedef: {goal.target}
          </Text>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-content-tertiary">
          <Meter
            value={goal.progressPct}
            label={`${goal.label} ilerlemesi`}
            tone="ai"
            noDataReason="İlerleme ölçülmüyor"
          />
          {goal.progressPct !== null && <span>%{goal.progressPct}</span>}
        </div>
      </CardBody>
    </Card>
  );
}

export function GoalBoard({
  env,
  filter = "",
}: {
  env: DataEnvelope<Goal[]> | null | undefined;
  /** Workspace header'daki aramadan gelir; boşsa filtre yok. */
  filter?: string;
}) {
  return (
    <DataGuard env={env} reason="Hedef tahtası verisi yok">
      {(goals, meta) => {
        const q = filter.trim().toLocaleLowerCase("tr");
        const visible = q
          ? goals.filter(
              (g) =>
                g.label.toLocaleLowerCase("tr").includes(q) ||
                (g.target ?? "").toLocaleLowerCase("tr").includes(q) ||
                g.level.toLocaleLowerCase("tr").includes(q)
            )
          : goals;

        if (visible.length === 0) {
          return (
            <EmptyState
              title={q ? "Eşleşen hedef yok" : "Hedef yok"}
              description={
                q
                  ? `"${filter}" için tahtada bir hedef bulunamadı.`
                  : "ODIN'de tanımlı bir hedef yok."
              }
              suggestion={
                q
                  ? "Aramayı temizleyerek tahtanın tamamını görebilirsin."
                  : "Hedefler ODIN'in goals kaydından gelir; UI hedef icat etmez."
              }
            />
          );
        }

        /* Kolonlar = verideki GERÇEK seviyeler, görüldükleri sırayla. */
        const levels = [...new Set(visible.map((g) => g.level))];

        return (
          <div className="flex flex-col gap-3">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
              {levels.map((level) => {
                const items = visible.filter((g) => g.level === level);
                return (
                  <div key={level} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" size="sm">
                        {level}
                      </Badge>
                      <span className="odin-num text-xs text-content-tertiary">
                        {items.length}
                      </span>
                    </div>
                    {items.map((g) => (
                      <GoalItem key={g.id} goal={g} />
                    ))}
                  </div>
                );
              })}
            </div>

            <TrustSignal meta={meta} />
          </div>
        );
      }}
    </DataGuard>
  );
}
