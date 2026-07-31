"use client";

/**
 * DirectorCard — ODIN AgentHealthMonitor kaydının kartı (09b §5, UI-ADR-111).
 *
 * SÖZLEŞME DÜZELTMESİ: eski kart 8 uydurulmuş alan çiziyordu ve ODIN'in
 * GERÇEK ürettiği metrikleri (gecikme, başarı oranı, hata oranı, maliyet)
 * hiç göstermiyordu. Şimdi yalnız kayıtta olan çizilir.
 *
 * CANLILIK TÜRETİLMEZ: "beatIntervalMs × 3 aşıldıysa offline" kuralı UI
 * icadıydı (meclis: "eşik icat edilmemeli") ve kaldırıldı. Durum ODIN'in
 * `verdict`idir — unknown / healthy / unhealthy; `last_heartbeat` yaş
 * olarak yazılır, yorumlanmaz. Bilmemek ile ölmüş olmak farklı şeylerdir
 * ve bu ayrımı artık ODIN yapar, UI değil.
 */

import type { AgentHealth } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { relativeTime, useNow } from "@/lib/clock/tick";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Caption, Heading, Num, type NumFormat } from "@/components/ui/typography";
import { NoData } from "@/components/ui/no-data";
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";

/** ODIN verdict sözlüğü — health.py yalnız bu üçünü yazar. */
const VERDICT = {
  healthy: { variant: "success", label: "Sağlıklı", glyph: "●" },
  unhealthy: { variant: "danger", label: "Sağlıksız", glyph: "▲" },
  unknown: { variant: "secondary", label: "Bilinmiyor", glyph: "○" },
} as const;

function Metric({
  label,
  value,
  format,
  reason,
}: {
  label: string;
  value: number | null;
  /* UI-ADR-145: bu birlik burada ELLE yeniden yazılıydı, oysa
     `typography.tsx` onu `NumFormat` olarak zaten export ediyor. İki
     kopya demek, `Num`a yeni bir biçim eklendiğinde buranın sessizce
     geride kalması demektir. */
  format?: NumFormat;
  reason: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-content-tertiary">{label}</dt>
      <dd className="mt-1">
        <Num
          value={value}
          format={format ?? "plain"}
          currency={format === "currency" ? "USD" : undefined}
          fractionDigits={format === "percent" ? 1 : undefined}
          noDataReason={reason}
        />
      </dd>
    </div>
  );
}

function DirectorView({ agent, meta }: { agent: AgentHealth; meta: DataMeta }) {
  const now = useNow();
  const v = VERDICT[agent.verdict] ?? VERDICT.unknown;
  const beatAge = relativeTime(agent.metrics.lastHeartbeat, now);
  const m = agent.metrics;

  return (
    <Card tone={agent.verdict === "healthy" ? "ai" : "default"}>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <Heading level={3} size={4}>
              {agent.name}
            </Heading>
            <Badge variant={v.variant} size="xs">
              {v.label}
            </Badge>
          </span>
        }
        actions={
          <Caption>
            {/* Yaş yazılır, canlılık YORUMLANMAZ (UI-ADR-111). */}
            {agent.metrics.lastHeartbeat && beatAge ? (
              <>
                <span aria-hidden="true" className="mr-1">
                  {v.glyph}
                </span>
                son atım {beatAge}
              </>
            ) : (
              <NoData reason="Heartbeat kaydı yok" />
            )}
          </Caption>
        }
      />

      <CardBody>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Metric
            label="Başarı oranı"
            value={m.successRate}
            format="percent"
            reason="Başarı oranı ölçülmedi"
          />
          <Metric
            label="Hata oranı"
            value={m.errorRate}
            format="percent"
            reason="Hata oranı ölçülmedi"
          />
          <Metric
            label="Kuyruk"
            value={m.queueLength}
            reason="Kuyruk bilinmiyor"
          />
          <Metric
            label="Gecikme (ort)"
            value={m.latencyMsAvg}
            reason="Gecikme ölçülmedi"
          />
          <Metric
            label="Gecikme (p95)"
            value={m.latencyMsP95}
            reason="p95 ölçülmedi"
          />
          <Metric
            label="Maliyet"
            value={m.costUsd}
            format="currency"
            reason="Maliyet bilinmiyor"
          />
        </dl>

        {agent.consecutiveFailures > 0 && (
          <p className="mt-3 text-sm text-warning">
            <span aria-hidden="true">▲</span> {agent.consecutiveFailures} ardışık
            hata
            {agent.lastFailure && (
              <span className="text-content-tertiary">
                {" "}
                · son: {relativeTime(agent.lastFailure, now) ?? agent.lastFailure}
              </span>
            )}
          </p>
        )}
      </CardBody>

      <CardFooter>
        <TrustSignal meta={meta} />
        <span className="ml-auto text-xs text-content-tertiary">
          {agent.checkedAt && (
            <>kontrol: {relativeTime(agent.checkedAt, now) ?? agent.checkedAt}</>
          )}
        </span>
      </CardFooter>
    </Card>
  );
}

export function DirectorCard({
  env,
}: {
  env: DataEnvelope<AgentHealth> | null | undefined;
}) {
  return (
    <DataGuard env={env} reason="Director sağlık verisi yok">
      {(agent, meta) => <DirectorView agent={agent} meta={meta} />}
    </DataGuard>
  );
}
