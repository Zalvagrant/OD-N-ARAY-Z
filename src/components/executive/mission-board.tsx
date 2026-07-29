"use client";

/**
 * MissionBoard — Mission Control'ün Primary Focus Area'sı
 * (03-information-architecture.md §5, 05-dashboard.md §5).
 *
 * Her workspace'te TEK primary odak vardır; Mission Control'de o odak budur.
 * Bu yüzden tahta ekranın en geniş ve en yüksek görsel ağırlıklı bloğudur.
 *
 * ANTI-FAKE:
 *  - `progressPercent === null` → ilerleme çubuğu çizilmez, NoData çıkar.
 *    "%0" ile "ölçülmüyor" farklı şeylerdir.
 *  - `deadline === null` → tarih uydurulmaz.
 *  - Durum yalnızca renkle verilmez; her sütunun adı ve her kartın rozeti var.
 *
 * ⚠️ `Mission` sözleşmesi TEKLİFTİR (`types/screens.ts`, 13-...md §14.2).
 */

import { relativeTime, remainingTime, useNow } from "@/lib/clock/tick";
import type { DataEnvelope } from "@/types/data-envelope";
import type { Mission, MissionStatus } from "@/types/screens";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoData } from "@/components/ui/no-data";
import { Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { Meter } from "./meter";
import { TrustSignal } from "./trust-signal";

const COLUMNS: { status: MissionStatus; label: string; variant: "secondary" | "primary" | "danger" | "success" }[] = [
  { status: "active", label: "Yürüyen", variant: "primary" },
  { status: "blocked", label: "Engelli", variant: "danger" },
  { status: "planned", label: "Planlı", variant: "secondary" },
  { status: "done", label: "Tamamlanan", variant: "success" },
];

function MissionItem({ mission }: { mission: Mission }) {
  const now = useNow();
  /* Termin bir YAŞ değil, kalan süredir — `relativeTime` gelecek tarihlerin
     hepsine "birazdan" diyordu (46 gün sonrası dahil). Tamamlanmış görevde
     ise soru tersine döner: kalan süre değil, ne zaman bittiği. Bitmiş bir
     görev için "2 gün gecikti" yazmak yanlış bilgidir. */
  const due =
    mission.status === "done"
      ? relativeTime(mission.deadline, now)
      : remainingTime(mission.deadline, now);

  return (
    <Card density="compact">
      <CardBody density="compact" className="flex flex-col gap-2">
        <p className="text-sm font-medium text-content">{mission.title}</p>
        <Text size="sm" tone="secondary">
          {mission.objective}
        </Text>

        <div className="flex flex-wrap items-center gap-2 text-xs text-content-tertiary">
          <Meter
            value={mission.progressPercent}
            label={`${mission.title} ilerlemesi`}
            tone={mission.status === "blocked" ? "warning" : "ai"}
            noDataReason="İlerleme ölçülmüyor"
          />
          {mission.progressPercent !== null && <span>%{mission.progressPercent}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-content-tertiary">
          <span>{mission.ownerDirector}</span>
          <span aria-hidden="true">·</span>
          {mission.deadline && due ? (
            <time dateTime={mission.deadline}>{due}</time>
          ) : (
            <NoData reason="Termin tarihi belirlenmedi" />
          )}
        </div>

        {mission.blockedReason && (
          <Text size="sm" tone="tertiary">
            Engel: {mission.blockedReason}
          </Text>
        )}
      </CardBody>
    </Card>
  );
}

export function MissionBoard({
  env,
  filter = "",
}: {
  env: DataEnvelope<Mission[]> | null | undefined;
  /** Workspace header'daki aramadan gelir; boşsa filtre yok. */
  filter?: string;
}) {
  return (
    <DataGuard env={env} reason="Görev tahtası verisi yok">
      {(missions, meta) => {
        const q = filter.trim().toLocaleLowerCase("tr");
        const visible = q
          ? missions.filter(
              (m) =>
                m.title.toLocaleLowerCase("tr").includes(q) ||
                m.objective.toLocaleLowerCase("tr").includes(q) ||
                m.ownerDirector.toLocaleLowerCase("tr").includes(q)
            )
          : missions;

        if (visible.length === 0) {
          return (
            <EmptyState
              title={q ? "Eşleşen görev yok" : "Görev yok"}
              description={
                q
                  ? `"${filter}" için tahtada bir görev bulunamadı.`
                  : "Şu an yürüyen bir görev tanımlı değil."
              }
              suggestion={
                q
                  ? "Aramayı temizleyerek tahtanın tamamını görebilirsin."
                  : "Onaylanan kararlar buraya görev olarak düşer."
              }
            />
          );
        }

        return (
          <div className="flex flex-col gap-3">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
              {COLUMNS.map((col) => {
                const items = visible.filter((m) => m.status === col.status);
                return (
                  <div key={col.status} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={col.variant} size="sm">
                        {col.label}
                      </Badge>
                      <span className="odin-num text-xs text-content-tertiary">
                        {items.length}
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <Text size="sm" tone="tertiary">
                        Bu sütunda görev yok.
                      </Text>
                    ) : (
                      items.map((m) => <MissionItem key={m.id} mission={m} />)
                    )}
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
