"use client";

/**
 * System Director — 06-workspaces.md §8.
 *
 * Tek soruyu cevaplar: *"ODIN şu anda sağlıklı çalışıyor mu?"*
 *
 * KPI ŞERİDİ SEKİZ KALEM İSTİYOR, ODIN BEŞİNİ YAYINLIYOR (§8.2):
 *   ✓ System Health · Storage · Active Services · Critical Alerts · Version
 *   ✗ Uptime · CPU · Memory — hiçbir uçta yok
 *
 * Eksik üçü gerekçesiyle boş görünür. Süreç başlangıcından uptime, ya da
 * olay hacminden CPU TÜRETMEK, ölçülmemiş bir sayıyı ölçülmüş gibi
 * göstermek olurdu — bu ekranın tek işi güvenilirliği bildirmek ve
 * uydurulmuş bir güvenilirlik göstergesi, göstergenin kendisini yok eder.
 *
 * Sağlık skoru ODIN'de hesaplanır (ADR-0129). Arayüz ortalamayı yeniden
 * kurmaz; kapsamı (`5/6`) skorun YANINDA gösterir çünkü kaç eksenin
 * ölçülebildiği skorun kendisi kadar bilgidir.
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinDirectors, useOdinSystem } from "@/lib/data/odin-state";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Caption, Heading, Num, Text } from "@/components/ui/typography";
import { Stat } from "@/components/ui/stat";
import { Section } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { DataGuard } from "@/components/executive/data-guard";
import { RuntimeDirectorCard } from "@/components/executive/runtime-director-card";

const DEMO_ERROR = demoError(
  "Sistem durumu okunamadı",
  "ODIN'in sağlık sinyalleri güncel değil."
);

/** MB — ham bayt okunmaz; birim çevirisi bir GÖSTERİM kararıdır, veri değil. */
const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);

export function SystemDirector({ demo }: { demo?: DemoState }) {
  const system = useOdinSystem();
  const directors = useOdinDirectors();

  const { loading, error, isEmpty, reloadAll } = screenState({
    demo,
    primary: system,
    sources: [system, directors],
    error: DEMO_ERROR,
  });

  /* `emptied()` LİSTE zarfları içindir (diziyi boşaltır); bu zarf bir
     nesne. Boş hâli `Section empty` yönetiyor — zarfı elle "boşaltmaya"
     çalışmak, olmayan bir boş-nesne kavramı uydurmak olurdu. */
  const env = system.envelope;
  const dirs = isEmpty ? [] : (directors.envelope?.data ?? []);
  const healthy = dirs.filter((d) => d.status === "healthy").length;

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="System Director"
        context="ODIN şu anda sağlıklı çalışıyor mu?"
        lastSync={system.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Sistem sağlığı"
        description="Ölçülen eksenler ve kapsamı."
        loading={loading}
        loadingLayout="list"
        loadingCount={4}
        error={error}
        onRetry={reloadAll}
        empty={isEmpty}
        emptyTitle="Sistem sinyali yok"
        emptyDescription="ODIN sağlık projeksiyonu yayınlamadı."
      >
        <DataGuard env={env} reason="Sistem sağlık verisi yok">
          {(s) => (
            <div className="flex flex-col gap-6">
              <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
                <Stat
                  label="System Health"
                  /* Kapsam skorun YANINDA: "5/6" olmadan 72, altı eksenin
                     ortalaması sanılır (ADR-0129'un varlık sebebi). */
                  note={`kapsam ${s.coverage}`}
                  value={
                    <>
                      <Num value={s.score} size="lg" noDataReason="Skor üretilmedi" />
                      <Caption>/ 100</Caption>
                    </>
                  }
                />
                <Stat
                  label="Storage"
                  note={`olay günlüğü ${mb(s.eventLogBytes)} MB`}
                  value={
                    <>
                      <Num value={s.diskUsedPct} size="lg" noDataReason="Disk ölçülmedi" />
                      <Caption>% dolu</Caption>
                    </>
                  }
                />
                <Stat
                  label="Active Services"
                  note={`${dirs.length} director`}
                  value={
                    <>
                      <Num value={healthy} size="lg" noDataReason="Servis sayısı yok" />
                      <Caption>/ {dirs.length} sağlıklı</Caption>
                    </>
                  }
                />
                <Stat
                  label="Critical Alerts"
                  note={`son olay #${s.lastSeq}`}
                  value={
                    <Num
                      value={s.criticalCount}
                      size="lg"
                      noDataReason="Kritik durum okunmadı"
                    />
                  }
                />
              </dl>

              {/* §8.2'nin ölçülemeyen üç kalemi — gizlenmez, gerekçelenir. */}
              <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
                <Stat
                  label="Current Version"
                  value={<Text size="sm">{s.version}</Text>}
                />
                <Stat
                  label="Uptime"
                  value={<Num value={null} noDataReason="Uptime ölçülmüyor" />}
                />
                <Stat
                  label="CPU"
                  value={<Num value={null} noDataReason="CPU ölçülmüyor" />}
                />
                <Stat
                  label="Memory"
                  value={<Num value={null} noDataReason="Bellek kullanımı ölçülmüyor" />}
                />
              </dl>

              <Card>
                <CardBody className="flex flex-col gap-3">
                  <Heading level={3} size={4}>
                    Ölçülen eksenler
                  </Heading>
                  <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 [&>div]:min-w-0">
                    {s.components.map((c) => (
                      <Stat
                        key={c.name}
                        label={c.name}
                        note={c.detail}
                        truncate
                        value={
                          <Num
                            value={c.value}
                            size="md"
                            noDataReason="Bu eksen ölçülmedi"
                          />
                        }
                      />
                    ))}
                  </dl>
                </CardBody>
              </Card>
            </div>
          )}
        </DataGuard>
      </Section>

      <Section
        title="Servis durumu"
        description="Zamanlanmış runtime işleri, kendi beyan ettikleri ajana göre."
        loading={loading}
        loadingLayout="list"
        loadingCount={6}
        error={error}
        onRetry={reloadAll}
        empty={isEmpty || dirs.length === 0}
        emptyTitle="Servis verisi yok"
        emptyDescription="Heartbeat servisi bağlı değil."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          {dirs.map((d) => (
            <RuntimeDirectorCard
              key={d.id}
              env={{ data: d, meta: directors.envelope!.meta }}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
