"use client";

/**
 * System · Storage — ODIN'in kendi veri dizini (UI-ADR-200).
 *
 * NEDEN AYRI EKRAN, KOPYA DEĞİL: /system ve /system/performance tek bir
 * `disk_used_pct` ile iki dosya boyutu gösteriyor. Burada cevaplanan soru
 * başka: HANGİ dizin büyüyor ve NE HIZLA. `/api/state` her istekte
 * `events.jsonl`i okuduğu için o dosyanın büyümesi bir gecikme bütçesidir.
 *
 * PROJEKSİYON YOK: "şu kadar gün sonra dolar" yazılmaz. Ölçülen büyüme
 * hızı ile ölçülen boş alan yan yana durur; hüküm sahibindir (UI-ADR-111
 * ile aynı kural — arayüz oran/tahmin türetmez).
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinStorage } from "@/lib/data/odin-storage";
import { formatDate } from "@/lib/format/date";
import { Card, CardBody } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Stat } from "@/components/ui/stat";
import { Caption, Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "Depolama envanteri okunamadı",
  "Veri dizininin boyut dökümü güncel değil."
);

const MB = 1_000_000;

/** Bayt → MB. Tek dönüşüm; yorum, eşik ve renk YOK. */
function Mb({ bytes }: { bytes: number }) {
  return (
    <>
      <Num value={bytes / MB} fractionDigits={bytes < MB ? 2 : 1} /> MB
    </>
  );
}

export function SystemStorage({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const storage = useOdinStorage();

  const zorlama = screenState({
    demo,
    primary: storage,
    sources: [storage],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (storage.error
      ? {
          what: storage.error.what,
          why: storage.error.why,
          impact: storage.error.impact,
          fix: storage.error.fix,
        }
      : null);

  /**
   * `empty` = "ÖLÇÜLDÜ, veri dizini boş" — `null` ("ölçülmedi") DEĞİL.
   * Bu ekranda ikisi farklı ifadedir (UI-ADR-151), o yüzden zarf atılmaz;
   * listeler boşaltılır. Disk boşaltılmaz: boş bir veri dizini diskin
   * ölçümünü geçersiz kılmaz.
   */
  const live = storage.envelope?.data ?? null;
  const s =
    zorlama.isEmpty && live
      ? { ...live, totalBytes: 0, totalFiles: 0, entries: [], logs: [] }
      : live;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <WorkspaceHeader
        title="Storage"
        context="ODIN'in veri dizini — ölçülen boyut ve ölçülen büyüme"
        lastSync={storage.envelope?.meta.lastUpdated ?? null}
      />

      <Section
        title="Toplam"
        description="Veri dizininin tamamı ve altındaki diskin boş alanı."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
      >
        {s && (
          <Card>
            <CardBody>
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <Stat
                  label="Veri dizini"
                  value={<Mb bytes={s.totalBytes} />}
                  note={s.dataDir}
                />
                <Stat
                  label="Dosya"
                  value={<Num value={s.totalFiles} />}
                  note="veri dizini altındaki tüm dosyalar"
                />
                <Stat
                  label="Disk doluluğu"
                  value={
                    <>
                      %<Num value={s.disk.usedPct} />
                    </>
                  }
                  note="ODIN'in değil, diskin tamamı"
                />
                <Stat
                  label="Boş alan"
                  value={
                    <>
                      <Num
                        value={s.disk.freeBytes / 1_000_000_000}
                        fractionDigits={1}
                      />{" "}
                      GB
                    </>
                  }
                  note="aynı diskte kalan yer"
                />
              </dl>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Büyüyen günlükler"
        description="Bayt/gün, günlüğün KENDİ ilk ve son kaydı arasındaki gözlemden ölçülür. Bir saatten kısa gözlemde hız yazılmaz."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={2}
        error={error}
        empty={s !== null && s.logs.length === 0}
        emptyTitle="Ekleme-yalnız günlük yok"
        emptyDescription="Veri dizininde events.jsonl / telemetry.jsonl bulunamadı."
      >
        {s && s.logs.length > 0 && (
          <Card>
            <CardBody>
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {s.logs.map((l) => (
                  <Stat
                    key={l.name}
                    label={l.name}
                    value={
                      l.bytesPerDay === null ? (
                        <NoData reason="Gözlem penceresi bir saatten kısa" />
                      ) : (
                        <>
                          <Num
                            value={l.bytesPerDay / MB}
                            fractionDigits={2}
                          />{" "}
                          MB/gün
                        </>
                      )
                    }
                    note={
                      l.spanDays === null
                        ? `${(l.bytes / MB).toFixed(1)} MB · gözlem yok`
                        : `${(l.bytes / MB).toFixed(1)} MB · ${l.spanDays} günlük gözlem`
                    }
                  />
                ))}
              </dl>
              {s.logs.some((l) => l.firstAt) && (
                <Text size="sm" tone="tertiary" className="mt-4">
                  {s.logs
                    .filter((l) => l.firstAt)
                    .map(
                      (l) =>
                        `${l.name}: ${formatDate(l.firstAt, {
                          dateStyle: "medium",
                        })} → ${formatDate(l.lastAt, { dateStyle: "medium" })}`
                    )
                    .join(" · ")}
                </Text>
              )}
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Dizin dökümü"
        description="Büyükten küçüğe — her satır o dizinin altındaki TÜM dosyaları sayar."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={6}
        error={error}
        empty={s !== null && s.entries.length === 0}
        emptyTitle="Veri dizini boş"
        emptyDescription="Veri dizininin altında hiçbir dosya yok."
      >
        {s && s.entries.length > 0 && (
          <Card>
            <CardBody className="flex flex-col gap-0">
              {s.entries.map((e) => (
                <div
                  key={e.name}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-1.5 last:border-b-0"
                >
                  <Mono size="sm">
                    {e.name}
                    {e.kind === "dir" ? "/" : ""}
                  </Mono>
                  <Caption>
                    <Num value={e.files} size="sm" /> dosya ·{" "}
                    <Mb bytes={e.bytes} />
                  </Caption>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </Section>

      {storage.envelope && (
        <TrustSignal
          meta={storage.envelope.meta}
          refreshFailed={storage.refreshError?.what}
        />
      )}
    </div>
  );
}
