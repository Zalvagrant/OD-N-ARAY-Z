"use client";

/**
 * Decision Center — 06-workspaces.md §2.
 *
 * NE GÖSTERİR: sahibin karara bağlaması BEKLENEN öneriler
 * (`/api/state.decision_queue`). ODIN'in kendi CEO akışından geliyor ve
 * tekilleştirmesi ÇEKİRDEKTE yapılıyor — ham akış 1.933 kayıt, 1.921'i
 * aynı risklerin heartbeat tekrarı, tekilleştirilince 26.
 *
 * NE GÖSTERMEZ: karar KAYITLARI. `/api/state.decisions` (FileDecisionLog)
 * ayrı bir anahtardır ve bugün BOŞTUR. Bir öneriyi karar diye çizmek,
 * sahibin vermediği kararı vermiş göstermek olurdu — bu ekranın adı
 * "Decision Center" olduğu için tam da burada en tehlikeli yanlış budur.
 * Bu yüzden başlık "karar bekleyen" der, "kararlar" demez.
 *
 * TEKRAR SAYISI GİZLENMEZ: 696 kez yazılmış bir uyarı ile bir kez
 * görüleni ayırt etmek okuyanın işidir. `occurrences` ODIN'den geldiği
 * gibi taşınır; arayüz ondan bir "aciliyet" TÜRETMEZ.
 */

import {
  demoError,
  emptied,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinDecisionQueue } from "@/lib/data/odin-state";
import { relativeTime, useNow } from "@/lib/clock/tick";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Caption, Heading, Text } from "@/components/ui/typography";
import { NoData } from "@/components/ui/no-data";
import { Section } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";

const DEMO_ERROR = demoError(
  "Karar kuyruğu okunamadı",
  "Bekleyen öneriler güncel değil."
);

/** Şiddet ODIN'in kendi alanı; arayüz eşik hesaplamaz (UI-ADR-111). */
const SEVERITY = {
  HIGH: { variant: "danger" as const, label: "Yüksek" },
  MEDIUM: { variant: "warning" as const, label: "Orta" },
  INFO: { variant: "secondary" as const, label: "Bilgi" },
};

export function DecisionCenter({ demo }: { demo?: DemoState }) {
  const queue = useOdinDecisionQueue();
  const now = useNow();

  const { loading, error, isEmpty, reloadAll } = screenState({
    demo,
    primary: queue,
    sources: [queue],
    error: DEMO_ERROR,
  });

  const env = isEmpty ? emptied(queue.envelope) : queue.envelope;
  const items = env?.data ?? [];
  const awaitingOwner = items.filter((d) => d.ownerApprovalRequired).length;

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="Decision Center"
        context="Hangi öneriler kararımı bekliyor?"
        lastSync={queue.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Karar bekleyenler"
        /* "Kararlar" DEĞİL: bunlar henüz karara bağlanmamış önerilerdir. */
        description={
          items.length > 0
            ? `${items.length} öneri · ${awaitingOwner} tanesi açıkça sahip onayı istiyor`
            : "ODIN'in karara bağlanmayı bekleyen önerileri."
        }
        loading={loading}
        loadingLayout="list"
        loadingCount={4}
        error={error}
        onRetry={reloadAll}
        empty={isEmpty || items.length === 0}
        emptyTitle="Bekleyen öneri yok"
        emptyDescription="ODIN karara bağlanmayı bekleyen bir öneri üretmedi."
      >
        <div className="flex flex-col gap-4">
          {items.map((d) => {
            const sev = SEVERITY[d.severity];
            return (
              <Card key={d.recId} tone={d.ownerApprovalRequired ? "ai" : "default"}>
                <CardHeader
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      <Heading level={3} size={4}>
                        {d.recommendation}
                      </Heading>
                      <Badge variant={sev.variant} size="xs">
                        {sev.label}
                      </Badge>
                      {d.ownerApprovalRequired ? (
                        <Badge variant="warning" size="xs">
                          sahip onayı gerekli
                        </Badge>
                      ) : null}
                      {d.councilNeeded ? (
                        <Badge variant="secondary" size="xs">
                          konsey gerekli
                        </Badge>
                      ) : null}
                    </span>
                  }
                  actions={
                    <Caption>
                      {/* Yaş yazılır, aciliyet YORUMLANMAZ. */}
                      son görülme {relativeTime(d.lastSeen, now) ?? "—"}
                    </Caption>
                  }
                />
                <CardBody className="flex flex-col gap-2">
                  {d.signal ? (
                    <Text size="sm">
                      Sinyal: {d.signal.risk}{" "}
                      <Caption>(seviye {d.signal.level})</Caption>
                    </Text>
                  ) : (
                    <Text size="sm" tone="tertiary">
                      Bu öneri bir risk sinyalinden doğmadı ({d.trigger}).
                    </Text>
                  )}

                  {d.rationale ? (
                    <Text size="sm" tone="tertiary">
                      Gerekçe: {d.rationale}
                    </Text>
                  ) : (
                    <Caption>
                      <NoData reason="ODIN bu öneri için gerekçe kaydetmedi" />
                    </Caption>
                  )}

                  <Caption>
                    {/* Tekrar sayısı BİLGİDİR: 696 kez yazılmış bir uyarı
                        ile bir kez görülen aynı şey değildir. Arayüz bundan
                        aciliyet TÜRETMEZ, sayıyı olduğu gibi gösterir. */}
                    {d.occurrences} kez yazıldı · ilk görülme{" "}
                    {relativeTime(d.firstSeen, now) ?? "—"} · sınıf{" "}
                    {d.klass ?? "—"}
                  </Caption>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
