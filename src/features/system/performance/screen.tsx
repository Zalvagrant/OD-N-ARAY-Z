"use client";

/**
 * System · Performance — çekirdeğin ölçülen nabzı (UI-ADR-199).
 *
 * ÜÇ KAYNAK, ÜÇÜ DE GERÇEK:
 *  · `/api/state.health` — son olay, sıra no, günlük boyutları (ham).
 *  · `/api/state.directors` — zamanlanmış işlerin KENDİ beyan ettiği
 *    sağlık; koşum ve hata sayıları KÜMÜLATİF ve YAN YANA ham gösterilir,
 *    arayüz başarı ORANI türetmez (UI-ADR-111).
 *  · İstemcinin kendi `/api/state` bekleme süresi — bu bir ODIN yayını
 *    DEĞİLDİR ve öyle etiketlenmez.
 *
 * Uptime / CPU / RAM bilerek YOK: hiçbir uçta yayınlanmıyor (system
 * ekranındaki kararın aynısı) — süreç başlangıcından türetmek ölçülmemişi
 * ölçülmüş göstermek olurdu.
 */

import {
  demoError,
  emptied,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import {
  useOdinDirectors,
  useOdinPerformance,
  useOdinStateLatency,
} from "@/lib/data/odin-state";
import { formatDate } from "@/lib/format/date";
import { relativeTime, useNow } from "@/lib/clock/tick";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Stat } from "@/components/ui/stat";
import { Caption, Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "Performans verisi okunamadı",
  "Çekirdek nabzı ve iş sağlığı güncel değil."
);

/** ODIN'in director sözlüğü → rozet. Değer kümesi çekirdekten gelir. */
const DIRECTOR_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  healthy: { label: "Sağlıklı", variant: "success" },
  stale: { label: "Gecikmiş", variant: "warning" },
  failed: { label: "Hata", variant: "danger" },
  unknown: { label: "Ölçülmedi", variant: "secondary" },
};

export function SystemPerformance({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const perf = useOdinPerformance();
  const directors = useOdinDirectors();
  const latency = useOdinStateLatency();
  const now = useNow();

  const zorlama = screenState({
    demo,
    primary: perf,
    sources: [perf, directors, latency],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (perf.error
      ? {
          what: perf.error.what,
          why: perf.error.why,
          impact: perf.error.impact,
          fix: perf.error.fix,
        }
      : null);

  const p = zorlama.isEmpty ? null : (perf.envelope?.data ?? null);
  const dirEnv = zorlama.isEmpty ? emptied(directors.envelope) : directors.envelope;
  const dirs = dirEnv?.data ?? null;
  const ms = zorlama.isEmpty ? null : (latency.envelope?.data.ms ?? null);

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <WorkspaceHeader
        title="Performance"
        context="Çekirdeğin ölçülen nabzı — sayılar ham, oran türetilmez"
        lastSync={perf.envelope?.meta.lastUpdated ?? null}
      />

      <Section
        title="Çekirdek nabzı"
        description="Olay günlüğünün son durumu ve boyutları."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
      >
        {p && (
          <Card>
            {/* `Stat` <dt>/<dd> basar — <dl> ebeveyni ŞART (axe dlitem;
                director-card ve glance-view aynı deseni kullanıyor). */}
            <CardBody>
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <Stat
                label="Son olay"
                value={
                  relativeTime(p.lastEventAt, now) ?? (
                    <NoData reason="Olay günlüğü boş" />
                  )
                }
                note={formatDate(p.lastEventAt, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
              <Stat
                label="Sıra no"
                value={<Num value={p.lastSeq} />}
                note="olay günlüğündeki son kayıt"
              />
              <Stat
                label="Olay günlüğü"
                value={
                  <>
                    <Num value={p.eventLogBytes / 1_000_000} fractionDigits={1} /> MB
                  </>
                }
                note="events.jsonl — /api/state bu dosyayı okur"
              />
              <Stat
                label="Telemetri"
                value={
                  p.telemetryBytes === null ? (
                    <NoData reason="Eski çekirdek telemetri boyutu yayınlamıyor" />
                  ) : (
                    <>
                      <Num value={p.telemetryBytes / 1_000_000} fractionDigits={1} /> MB
                    </>
                  )
                }
                note="telemetry.jsonl"
              />
              </dl>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Zamanlanmış işler"
        description="Her işin KENDİ beyan ettiği sağlık — koşum ve hata sayıları kümülatif, oran türetilmez."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={4}
        error={error}
        empty={dirs !== null && dirs.length === 0}
        emptyTitle="Zamanlanmış iş yok"
        emptyDescription="ODIN hiçbir zamanlanmış iş bildirmedi."
      >
        {dirs && dirs.length > 0 && (
          <div className="flex flex-col gap-4">
            {dirs.map((d) => {
              const s = DIRECTOR_STATUS[d.status] ?? DIRECTOR_STATUS.unknown;
              return (
                <Card key={d.id}>
                  <CardHeader
                    title={
                      <span className="flex items-center gap-2">
                        <Mono size="sm">{d.id}</Mono>
                        <Badge variant={s.variant} size="xs">
                          {s.label}
                        </Badge>
                      </span>
                    }
                    actions={
                      <Caption>
                        son atım {relativeTime(d.lastBeat, now) ?? "—"}
                      </Caption>
                    }
                  />
                  <CardBody className="flex flex-col gap-2">
                    {d.jobs.map((j) => {
                      const js = DIRECTOR_STATUS[j.status] ?? DIRECTOR_STATUS.unknown;
                      return (
                        <div
                          key={j.id}
                          className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-1.5 last:border-b-0"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Mono size="sm">{j.id}</Mono>
                            <Badge variant={js.variant} size="xs">
                              {js.label}
                            </Badge>
                            {j.cadence ? <Caption>{j.cadence}</Caption> : null}
                          </span>
                          <Caption>
                            koşum{" "}
                            {j.runs !== undefined ? (
                              <Num value={j.runs} size="sm" />
                            ) : (
                              "—"
                            )}{" "}
                            · hata{" "}
                            {j.failuresTotal !== undefined ? (
                              <Num value={j.failuresTotal} size="sm" />
                            ) : (
                              "—"
                            )}{" "}
                            · son atım {relativeTime(j.lastBeat, now) ?? "—"}
                          </Caption>
                          {j.lastError ? (
                            <Text size="sm" tone="tertiary" className="w-full">
                              Son hata: {j.lastError}
                            </Text>
                          ) : null}
                        </div>
                      );
                    })}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="/api/state bekleme süresi"
        description="Bu İSTEMCİNİN son isteğinde ölçüldü — ODIN yayını değil; sunucu kendi süresini yayınlarsa ayrıca gösterilir."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={1}
        error={error}
      >
        {!zorlama.loading && !error && (
          <Card density="compact">
            <CardBody density="compact">
              {ms === null ? (
                <NoData reason="Bu oturumda henüz ölçüm yok" />
              ) : (
                <dl>
                  <Stat
                    label="Son istek"
                    value={
                      <>
                        <Num value={ms} /> ms
                      </>
                    }
                    note="tarayıcıdan ölçülen uçtan uca bekleme"
                  />
                </dl>
              )}
            </CardBody>
          </Card>
        )}
      </Section>

      {perf.envelope && (
        <TrustSignal
          meta={perf.envelope.meta}
          refreshFailed={perf.refreshError?.what}
        />
      )}
    </div>
  );
}
