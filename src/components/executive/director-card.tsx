"use client";

/**
 * DirectorCard — 07-ai-directors.md §12, 09-data-contracts.md §4.
 *
 * "Karta bakınca ajanın canlı olduğu hissedilmelidir."
 * Ama bu his VERİDEN gelir, animasyondan değil.
 *
 * ANTI-FAKE ZİNCİRİ:
 *  1. Zarf boşsa kart hiç çizilmez (DataGuard).
 *  2. `lastBeat` yoksa canlılık BİLİNMİYOR — "offline" da denmez.
 *  3. `lastBeat`, `beatIntervalMs * 3`'ten eskiyse kart offline'a düşer:
 *     durum rozeti "offline" olur, nabız durur, kart soluklaşır.
 *     Veri "analyzing" dese bile offline kazanır — çünkü o bilgi eskimiştir.
 *  4. `confidence` üretilmemişse rozet YOK.
 *
 * "Director'lar hiçbir zaman inactive görünmez": `idle` durumu boş kart
 * değil, "Idle — monitoring" olarak yazılır.
 */

import type { DirectorHeartbeat, DirectorStatus } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heading, Num, Text } from "@/components/ui/typography";
import { NoData } from "@/components/ui/no-data";
import { DataGuard } from "./data-guard";
import { ConfidenceBadge } from "./confidence-badge";
import { TrustSignal } from "./trust-signal";
import { HeartbeatIndicator } from "./heartbeat-indicator";
import { liveness, useNow } from "@/lib/clock/tick";

const STATUS: Record<DirectorStatus, { label: string; variant: "primary" | "secondary" | "success" | "warning" | "danger" | "info" }> = {
  idle: { label: "Idle — monitoring", variant: "secondary" },
  monitoring: { label: "Monitoring", variant: "info" },
  analyzing: { label: "Analyzing", variant: "primary" },
  reviewing: { label: "Reviewing", variant: "primary" },
  processing: { label: "Processing", variant: "primary" },
  discovering: { label: "Discovering", variant: "primary" },
  error: { label: "Error", variant: "danger" },
  offline: { label: "Offline", variant: "secondary" },
};

const MEMORY = {
  healthy: { label: "Healthy", variant: "success" },
  degraded: { label: "Degraded", variant: "warning" },
  critical: { label: "Critical", variant: "danger" },
} as const;

const PREDICTION = {
  running: { label: "Running", variant: "success" },
  idle: { label: "Idle", variant: "secondary" },
  failed: { label: "Failed", variant: "danger" },
} as const;

function Stat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-content-tertiary">{label}</dt>
      <dd className="mt-1">
        <Num
          value={Number.isFinite(value as number) ? (value as number) : null}
          noDataReason={`${label} bilinmiyor`}
        />
      </dd>
    </div>
  );
}

function DirectorView({ d, meta }: { d: DirectorHeartbeat; meta: DataMeta }) {
  const now = useNow();
  const live = liveness(d.lastBeat, d.beatIntervalMs, now);

  /* Eski veri "analyzing" dese de offline kazanır. */
  const effective: DirectorStatus = live === "offline" ? "offline" : d.status;
  const status = STATUS[effective] ?? STATUS.idle;
  const memory = MEMORY[d.memoryHealth];
  const prediction = PREDICTION[d.predictionStatus];

  return (
    <Card tone={live === "offline" ? "default" : "ai"}>
      <CardHeader
        title={
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={3} size={4}>
              {d.name}
            </Heading>
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
          </div>
        }
        actions={<HeartbeatIndicator lastBeat={d.lastBeat} beatIntervalMs={d.beatIntervalMs} />}
      />

      <CardBody>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-content-tertiary">Current Goal</p>
            {d.currentGoal ? (
              <Text tone="secondary">{d.currentGoal}</Text>
            ) : (
              <NoData reason="Hedef atanmadı" />
            )}
          </div>

          {d.currentTask && (
            <div>
              <p className="text-xs text-content-tertiary">Current Task</p>
              <Text size="sm" tone="secondary">
                {d.currentTask}
              </Text>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-content-tertiary">Confidence</dt>
              <dd className="mt-1">
                {Number.isFinite(d.confidence as number) ? (
                  <ConfidenceBadge value={d.confidence} />
                ) : (
                  <NoData reason="Güven skoru üretilmedi" />
                )}
              </dd>
            </div>
            <Stat label="Tasks" value={d.taskCount} />
            <Stat label="Queue" value={d.queueLength} />
            <Stat label="Evidence" value={d.evidenceCount} />
            <Stat label="Recommendations" value={d.recommendationCount} />
            <div>
              <dt className="text-xs text-content-tertiary">Memory</dt>
              <dd className="mt-1">
                {memory ? (
                  <Badge variant={memory.variant} size="sm">
                    {memory.label}
                  </Badge>
                ) : (
                  <NoData reason="Hafıza durumu bilinmiyor" />
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-content-tertiary">Prediction</dt>
              <dd className="mt-1">
                {prediction ? (
                  <Badge variant={prediction.variant} size="sm">
                    {prediction.label}
                  </Badge>
                ) : (
                  <NoData reason="Tahmin durumu bilinmiyor" />
                )}
              </dd>
            </div>
          </dl>

          {live === "offline" && (
            <Text size="sm" tone="warning">
              Atım alınmıyor — yukarıdaki değerler son bilinen durumdur, canlı değildir.
            </Text>
          )}
        </div>
      </CardBody>

      <CardFooter>
        <TrustSignal meta={meta} />
      </CardFooter>
    </Card>
  );
}

export function DirectorCard({
  env,
}: {
  env: DataEnvelope<DirectorHeartbeat> | null | undefined;
}) {
  return (
    <DataGuard env={env} reason="Director verisi yok">
      {(d, meta) => <DirectorView d={d} meta={meta} />}
    </DataGuard>
  );
}
