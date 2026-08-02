"use client";

/**
 * System · Version — ne çalışıyor, tam olarak (UI-ADR-211).
 *
 * Gece taraması "`version` + `phases` /system ekranında ZATEN görünüyor;
 * ayrı sayfa kopya olur" demişti. Kopya OLURDU — eğer bu ekran da
 * yalnız o iki alanı gösterseydi. Buradaki soru daha dar ve daha
 * kullanışlı: **çalışan kod tam olarak hangi commit?**
 *
 * KİRLİ AĞAÇ GİZLENMİYOR: `working_tree_clean` false ise çalışan kod
 * ekranda yazan commit DEĞİLDİR ve bu uyarı olarak basılır. Commit
 * kimliğini temiz göstermek onu bir yalana çevirirdi.
 *
 * Faz ilerlemeleri roadmap'in KENDİ beyanıdır; arayüz toplam bir "proje
 * tamamlanma yüzdesi" TÜRETMEZ (UI-ADR-111).
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinVersion } from "@/lib/data/odin-config";
import { formatDate } from "@/lib/format/date";
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
  "Sürüm bilgisi okunamadı",
  "Çalışan kodun kimliği doğrulanamıyor."
);

const PHASE: Record<string, "success" | "warning" | "secondary"> = {
  done: "success",
  active: "warning",
  planned: "secondary",
};

export function SystemVersion({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const version = useOdinVersion();

  const zorlama = screenState({
    demo,
    primary: version,
    sources: [version],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (version.error
      ? {
          what: version.error.what,
          why: version.error.why,
          impact: version.error.impact,
          fix: version.error.fix,
        }
      : null);

  const live = version.envelope?.data ?? null;
  /** `empty` = "ÖLÇÜLDÜ, roadmap fazı bildirilmemiş". */
  const v = zorlama.isEmpty && live ? { ...live, phases: [] } : live;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <WorkspaceHeader
        title="Version"
        context="Çalışan kodun kimliği — sabitten değil, ağaçtan ölçülür"
        lastSync={version.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Çalışan sürüm"
        description="Sürüm dizesi ODIN'in beyanı; commit ve dal çalışma ağacından okunur."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {v && (
          <Card>
            <CardBody className="flex flex-col gap-6">
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <Stat
                  label="ODIN"
                  value={<Mono size="sm">{v.odin}</Mono>}
                  note="çekirdeğin beyan ettiği sürüm"
                />
                <Stat
                  label="Commit"
                  value={
                    v.commit ? (
                      <Mono size="sm">{v.commit}</Mono>
                    ) : (
                      <NoData reason="Bu kopyada git yok" />
                    )
                  }
                  note={v.branch ?? "dal bilinmiyor"}
                />
                <Stat
                  label="Python"
                  value={<Mono size="sm">{v.python}</Mono>}
                  note="çalışan yorumlayıcı"
                />
                <Stat
                  label="Son commit"
                  value={
                    v.committedAt ? (
                      <Caption>
                        {formatDate(v.committedAt, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </Caption>
                    ) : (
                      <NoData reason="Commit tarihi okunamadı" />
                    )
                  }
                  note="ağaçtaki en son kayıt"
                />
              </dl>

              {v.workingTreeClean === false && (
                <Text size="sm" tone="tertiary">
                  ⚠ Çalışma ağacı KİRLİ: kaydedilmemiş değişiklikler var,
                  yani çalışan kod yukarıdaki commit DEĞİLDİR. Bu satır
                  bilerek duruyor — temiz göstermek commit kimliğini
                  yalana çevirirdi.
                </Text>
              )}
              {v.workingTreeClean === null && (
                <Caption>
                  Çalışma ağacının durumu bilinmiyor (bu kopyada git yok).
                </Caption>
              )}
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Yönetişim envanteri"
        description="Kararların ve şemaların sayısı — dosya sisteminden sayılır."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={2}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {v && (
          <Card density="compact">
            <CardBody density="compact">
              <dl className="grid grid-cols-2 gap-6">
                <Stat
                  label="ADR"
                  value={
                    v.adrCount === null ? (
                      <NoData reason="docs/adr dizini yok" />
                    ) : (
                      <Num value={v.adrCount} />
                    )
                  }
                  note="mimari karar kaydı"
                />
                <Stat
                  label="Şema"
                  value={
                    v.schemaCount === null ? (
                      <NoData reason="schemas dizini yok" />
                    ) : (
                      <Num value={v.schemaCount} />
                    )
                  }
                  note="sözleşme dosyası"
                />
              </dl>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Yol haritası"
        description="Roadmap'in KENDİ beyanı. Arayüz toplam bir tamamlanma yüzdesi türetmez."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={v !== null && v.phases.length === 0}
        emptyTitle="Faz bildirilmedi"
        emptyDescription="Çekirdek hiçbir roadmap fazı yayınlamıyor."
      >
        {v && v.phases.length > 0 && (
          <Card>
            <CardBody className="flex flex-col gap-0">
              {v.phases.map((p) => (
                <div
                  key={p.name}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-1.5 last:border-b-0"
                >
                  <span className="flex items-center gap-2">
                    <Badge
                      variant={PHASE[p.status] ?? "secondary"}
                      size="xs"
                    >
                      {p.status}
                    </Badge>
                    <Text size="sm">{p.name}</Text>
                  </span>
                  <Caption>
                    %<Num value={p.progress} size="sm" /> (roadmap beyanı)
                  </Caption>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </Section>

      {version.envelope && (
        <TrustSignal
          meta={version.envelope.meta}
          refreshFailed={version.refreshError?.what}
        />
      )}
    </div>
  );
}
