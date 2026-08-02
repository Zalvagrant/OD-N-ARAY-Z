"use client";

/**
 * Automation — ODIN ben yokken ne yapıyor (UI-ADR-210).
 *
 * Gece taraması "zamanlanmış işler /system/performance'ta AÇILDI; ayrı
 * automation ekranı aynı verinin kopyası olur" demişti. **Aynı işler,
 * FARKLI soru:** Performance "sağlıklı mı" diye sorar (director'ların
 * kendi beyanı), burası "ne, ne zaman, vadesi geldi mi" diye. Cadence,
 * tetikleyici ve VADE hiçbir yerde yayınlanmıyordu — `runtime.status()`
 * yalnız son-koşum haritasını döndürüyordu.
 *
 * VADE ARAYÜZDE HESAPLANMAZ: scheduler'ın kendi kuralı üretir. Burada
 * bir zaman aritmetiği yapsaydım ekran runtime ile çelişebilirdi ve
 * çelişen taraf her zaman ekran olurdu.
 *
 * BAŞARI ORANI TÜRETİLMEZ: koşum ve hata ham, yan yana (UI-ADR-111).
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinAutomation } from "@/lib/data/odin-automation";
import { relativeTime, useNow } from "@/lib/clock/tick";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Stat } from "@/components/ui/stat";
import { Caption, Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "Otomasyon tablosu okunamadı",
  "Zamanlanmış işler ve vade durumu güncel değil."
);

export function Automation({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const automation = useOdinAutomation();
  const now = useNow();

  const zorlama = screenState({
    demo,
    primary: automation,
    sources: [automation],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (automation.error
      ? {
          what: automation.error.what,
          why: automation.error.why,
          impact: automation.error.impact,
          fix: automation.error.fix,
        }
      : null);

  const live = automation.envelope?.data ?? null;
  /** `empty` = "ÖLÇÜLDÜ, zamanlanmış iş yok" — "ölçülmedi" DEĞİL. */
  const a =
    zorlama.isEmpty && live
      ? { ...live, jobs: [], total: 0, dueNow: 0, neverRun: 0 }
      : live;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <WorkspaceHeader
        title="Automation"
        context="Kendiliğinden koşan işler — ne, ne zaman, vadesi geldi mi"
        lastSync={automation.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Sürücü"
        description="İşleri koşturan heartbeat ve onu ayakta tutan watchdog."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {a && (
          <Card>
            <CardBody className="flex flex-col gap-6">
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <Stat
                  label="Runtime"
                  value={
                    <Badge
                      variant={a.runtime.alive ? "success" : "danger"}
                      size="xs"
                    >
                      {a.runtime.alive ? "Canlı" : "BAYAT/ÖLÜ"}
                    </Badge>
                  }
                  note={
                    a.runtime.heartbeatAgeS === null
                      ? "hiç heartbeat yazılmamış"
                      : `heartbeat ${a.runtime.heartbeatAgeS} sn önce · eşik ${a.runtime.staleThresholdS} sn`
                  }
                />
                <Stat
                  label="Tik"
                  value={
                    <>
                      <Num value={a.runtime.tickSeconds} /> sn
                    </>
                  }
                  note="iki heartbeat arası"
                />
                <Stat
                  label="Cockpit"
                  value={
                    <Badge
                      variant={
                        a.watchdog.cockpitListening ? "success" : "danger"
                      }
                      size="xs"
                    >
                      {a.watchdog.cockpitListening ? "Dinliyor" : "KAPALI"}
                    </Badge>
                  }
                  note={`port ${a.watchdog.cockpitPort} — watchdog bunu gözetiyor`}
                />
                <Stat
                  label="Açılışta başlat"
                  value={
                    <Badge
                      variant={
                        a.watchdog.autostartInstalled ? "success" : "warning"
                      }
                      size="xs"
                    >
                      {a.watchdog.autostartInstalled ? "Kurulu" : "Kurulu değil"}
                    </Badge>
                  }
                  note="logon → watchdog → runtime"
                />
              </dl>
              <Caption>
                <Mono size="sm">{a.watchdog.startupCmd}</Mono>
              </Caption>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Zamanlanmış işler"
        description="Vadesi gelenler üstte. Vade scheduler'ın KENDİ kuralıyla hesaplanır; koşum ve hata ham, oran türetilmez."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={8}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={a !== null && a.jobs.length === 0}
        emptyTitle="Zamanlanmış iş yok"
        emptyDescription="Runtime hiçbir iş bildirmedi."
      >
        {a && a.jobs.length > 0 && (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-3 gap-6">
              <Stat label="İş" value={<Num value={a.total} />} note="toplam" />
              <Stat
                label="Vadesi gelen"
                value={<Num value={a.dueNow} />}
                note="şu anda koşması gereken"
              />
              <Stat
                label="Hiç koşmamış"
                value={<Num value={a.neverRun} />}
                note="tek bir kaydı yok"
              />
            </dl>
            <Card>
              <CardBody className="flex flex-col gap-0">
                {a.jobs.map((j) => (
                  <div
                    key={j.name}
                    className="flex flex-col gap-1 border-b border-line py-2 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Mono size="sm">{j.name}</Mono>
                        {j.dueNow && (
                          <Badge variant="warning" size="xs">
                            Vadesi geldi
                          </Badge>
                        )}
                        {j.cadence ? <Caption>{j.cadence}</Caption> : null}
                      </span>
                      <Caption>
                        {j.lastRunAt ? (
                          <>son koşum {relativeTime(j.lastRunAt, now) ?? "—"}</>
                        ) : (
                          <NoData reason="Bu iş hiç koşmadı" />
                        )}
                      </Caption>
                    </div>
                    <Caption>
                      {j.agent ?? "ajansız"} · tetikleyici{" "}
                      <Mono size="sm">
                        {j.kind} {j.trigger}
                      </Mono>{" "}
                      · koşum{" "}
                      {j.runs !== null ? <Num value={j.runs} size="sm" /> : "—"}{" "}
                      · hata{" "}
                      {j.failures !== null ? (
                        <Num value={j.failures} size="sm" />
                      ) : (
                        "—"
                      )}
                      {j.avgMs !== null ? ` · ort ${j.avgMs} ms` : ""}
                    </Caption>
                    {j.lastError ? (
                      <Text size="sm" tone="tertiary">
                        Son hata: {j.lastError}
                      </Text>
                    ) : null}
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        )}
      </Section>

      {automation.envelope && (
        <TrustSignal
          meta={automation.envelope.meta}
          refreshFailed={automation.refreshError?.what}
        />
      )}
    </div>
  );
}
