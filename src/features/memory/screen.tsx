"use client";

/**
 * Memory — ODIN'in yönetici hafızası (UI-ADR-201).
 *
 * `/decisions` ŞU AN AÇIK olanı gösterir; burası ODIN'in HATIRLADIĞI
 * her şeyi: bugüne kadar ürettiği tüm öneriler ve sahibin verdiği tüm
 * kararlar. İki ayrı soru — bu yüzden iki ayrı ekran.
 *
 * FİLTRE YOK: her verdict gerekçesiyle listelenir, zayıf gerekçeli olan
 * da. Kendi defterinden utanan bir defter işe yaramaz; ekleme-yalnız
 * kayıt (ADR-0005) ancak sahip içine bakabildiği sürece bir anlam taşır.
 *
 * ORAN YOK: "2.329 öneri / 1 karar" yan yana ham durur. Arayüz bundan
 * bir "karar verme yüzdesi" ya da kalite skoru TÜRETMEZ (UI-ADR-111).
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinMemory } from "@/lib/data/odin-memory";
import { formatDate } from "@/lib/format/date";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Caption, Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "Yönetici hafızası okunamadı",
  "Öneri ve karar geçmişi güncel değil."
);

/** ODIN'in verdict sözlüğü (lifecycle.VERDICTS) — arayüz eşleme icat etmez. */
const VERDICT: Record<string, { label: string; variant: BadgeVariant }> = {
  approved: { label: "Onaylandı", variant: "success" },
  rejected: { label: "Reddedildi", variant: "danger" },
  deferred: { label: "Ertelendi", variant: "warning" },
};

function Buckets({ items }: { items: { name: string; count: number }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((b) => (
        <Badge key={b.name} variant="secondary" size="xs">
          {b.name} · {b.count}
        </Badge>
      ))}
    </div>
  );
}

export function Memory({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const memory = useOdinMemory();

  const zorlama = screenState({
    demo,
    primary: memory,
    sources: [memory],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (memory.error
      ? {
          what: memory.error.what,
          why: memory.error.why,
          impact: memory.error.impact,
          fix: memory.error.fix,
        }
      : null);

  /** `empty` = "ÖLÇÜLDÜ, hafıza boş" — "ölçülmedi" (null) DEĞİL. */
  const live = memory.envelope?.data ?? null;
  const m =
    zorlama.isEmpty && live
      ? {
          recommendations: {
            ...live.recommendations,
            total: 0,
            withVerdict: 0,
            firstAt: null,
            lastAt: null,
            byTrigger: [],
            byClass: [],
            bySeverity: [],
          },
          verdicts: { total: 0, byVerdict: [], recent: [] },
          outcomes: { total: 0, lessons: [] },
        }
      : live;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <WorkspaceHeader
        title="Memory"
        context="ODIN'in hatırladığı her öneri ve sahibin verdiği her karar"
        lastSync={memory.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Hafızanın büyüklüğü"
        description="Sayılar ham ve yan yana — oran türetilmez."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {m && (
          <Card>
            <CardBody className="flex flex-col gap-6">
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <Stat
                  label="Öneri"
                  value={<Num value={m.recommendations.total} />}
                  note="ODIN'in bugüne kadar ürettiği tüm öneriler"
                />
                <Stat
                  label="Karar verilmiş"
                  value={<Num value={m.recommendations.withVerdict} />}
                  note="sahibin hüküm verdiği öneri sayısı"
                />
                <Stat
                  label="Verdict"
                  value={<Num value={m.verdicts.total} />}
                  note="kayıtlı tüm hükümler (aynı öneri birden çok kez)"
                />
                <Stat
                  label="Sonuç kaydı"
                  value={<Num value={m.outcomes.total} />}
                  note="gerçekleşen sonucun sahip tarafından yazılması"
                />
              </dl>
              {m.recommendations.firstAt && (
                <Text size="sm" tone="tertiary">
                  Hafıza penceresi:{" "}
                  {formatDate(m.recommendations.firstAt, {
                    dateStyle: "medium",
                  })}{" "}
                  →{" "}
                  {formatDate(m.recommendations.lastAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
              )}
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Öneriler neyden doğdu"
        description="Tetikleyici, sınıf ve önem dağılımı — çekirdeğin kendi etiketleri."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={m !== null && m.recommendations.total === 0}
        emptyTitle="Hafıza boş"
        emptyDescription="ODIN henüz hiç öneri üretmedi."
      >
        {m && m.recommendations.total > 0 && (
          <Card>
            <CardBody className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Caption>Tetikleyici</Caption>
                <Buckets items={m.recommendations.byTrigger} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Caption>Sınıf (ADR-0131)</Caption>
                <Buckets items={m.recommendations.byClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Caption>Önem</Caption>
                <Buckets items={m.recommendations.bySeverity} />
              </div>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Sahibin karar geçmişi"
        description="Her hüküm gerekçesiyle listelenir — filtre yok, en yeni üstte."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={m !== null && m.verdicts.recent.length === 0}
        emptyTitle="Henüz hiç karar verilmedi"
        emptyDescription="Hafızada bir öneri var ama sahip hiçbirine hüküm yazmadı."
      >
        {m && m.verdicts.recent.length > 0 && (
          <div className="flex flex-col gap-4">
            <Buckets items={m.verdicts.byVerdict} />
            {m.verdicts.recent.map((v) => {
              const badge = VERDICT[v.verdict];
              return (
                <Card key={`${v.recId}-${v.at}`}>
                  <CardBody className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="flex items-center gap-2">
                        {badge ? (
                          <Badge variant={badge.variant} size="xs">
                            {badge.label}
                          </Badge>
                        ) : (
                          /* Sözlük dışı bir hüküm GİZLENMEZ, olduğu gibi
                             basılır — çekirdek sözlüğü genişletmişse
                             sahibi bunu görmelidir. */
                          <Badge variant="secondary" size="xs">
                            {v.verdict}
                          </Badge>
                        )}
                        {v.recClass ? (
                          <Caption>sınıf {v.recClass}</Caption>
                        ) : null}
                      </span>
                      <Caption>
                        {formatDate(v.at, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </Caption>
                    </div>
                    <Text>{v.recommendation ?? "(öneri kaydı bulunamadı)"}</Text>
                    <Text size="sm" tone="tertiary">
                      Gerekçe: {v.reason ?? "yazılmadı"}
                    </Text>
                    <Mono size="sm">{v.recId}</Mono>
                    {v.revisitAt ? (
                      <Caption>
                        yeniden görüşme:{" "}
                        {formatDate(v.revisitAt, { dateStyle: "medium" })}
                      </Caption>
                    ) : null}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Öğrenilen dersler"
        description="Sahip gerçekleşen sonucu yazdıkça ODIN'in davranış modeli buradan öğrenir (ADR-0046)."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={2}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={m !== null && m.outcomes.lessons.length === 0}
        emptyTitle="Henüz ders yok"
        emptyDescription="Hiçbir öneri için gerçekleşen sonuç kaydedilmedi — davranış modeli bu yüzden boş."
      >
        {m && m.outcomes.lessons.length > 0 && (
          <div className="flex flex-col gap-4">
            {m.outcomes.lessons.map((l) => (
              <Card key={`${l.recId}-${l.at}`}>
                <CardBody className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" size="xs">
                      {l.outcome ?? "—"}
                    </Badge>
                    <Caption>
                      {formatDate(l.at, { dateStyle: "medium" })}
                    </Caption>
                  </span>
                  <Text>{l.lesson}</Text>
                  <Mono size="sm">{l.recId}</Mono>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {memory.envelope && (
        <TrustSignal
          meta={memory.envelope.meta}
          refreshFailed={memory.refreshError?.what}
        />
      )}
    </div>
  );
}
