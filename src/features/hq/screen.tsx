"use client";

/**
 * ODIN HQ — günün tek giriş ekranı (UI-ADR-213).
 *
 * NEDEN KOPYA DEĞİL: gece taraması "mevcut ekranların toplamı" demişti ve
 * kompozit olduğu DOĞRU. Kopya olmasını engelleyen şey, hiçbir şeyi
 * yeniden çizmemesi: burada tek bir tablo, tek bir döküm, tek bir grafik
 * YOK. Yalnızca **"bugün beni ne bekliyor"** sorusunun sayısal cevabı ve
 * cevabın bulunduğu ekrana giden bağlantı var. Detay her zaman kendi
 * ekranındadır — HQ oraya götürür, oranın işini yapmaz.
 *
 * YENİ UÇ YOK: dört mevcut kanca (karar kuyruğu · alarmlar · sistem
 * sağlığı · runtime nabzı). Yeni bir istek açmıyor, ekranlarınkiyle
 * birleşiyor (istek coalescing).
 *
 * SAYI TÜRETİLMEZ: her rakam bir listenin uzunluğu ya da çekirdeğin
 * yayınladığı bir değerdir. "Genel durum skoru" gibi bileşik bir sayı
 * üretmek, ODIN'in reddettiği her şeyi tek yerde toplamak olurdu.
 */

import Link from "next/link";
import { useMemo } from "react";

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinAlerts, useOdinDecisionQueue, useOdinSystem } from "@/lib/data/odin-state";
import { relativeTime, useNow } from "@/lib/clock/tick";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Stat } from "@/components/ui/stat";
import { Caption, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";

const DEMO_ERROR = demoError(
  "Genel durum okunamadı",
  "Bekleyen karar, alarm ve sistem nabzı görüntülenemiyor."
);

/** Bir sayı ve onu açıklayan ekrana giden bağlantı. */
function Gecis({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-content-secondary underline underline-offset-2 hover:text-content"
    >
      {label} →
    </Link>
  );
}

export function Hq({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const queue = useOdinDecisionQueue();
  const alerts = useOdinAlerts();
  const system = useOdinSystem();
  const now = useNow();

  const zorlama = screenState({
    demo,
    primary: system,
    sources: [queue, alerts, system],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (system.error
      ? {
          what: system.error.what,
          why: system.error.why,
          impact: system.error.impact,
          fix: system.error.fix,
        }
      : null);

  /* `useMemo` ŞART: aşağıdaki türetmeler bunları bağımlılık alıyor ve
     her render'da yeni bir dizi üretmek onları boşuna yeniden
     hesaplatırdı (kapı uyarı olarak yakaladı). */
  const bos = zorlama.isEmpty;
  const kuyruk = useMemo(
    () => (bos ? [] : (queue.envelope?.data ?? null)),
    [bos, queue.envelope]
  );
  const alarm = useMemo(
    () => (bos ? [] : (alerts.envelope?.data ?? null)),
    [bos, alerts.envelope]
  );
  /* `empty` = "ÖLÇÜLDÜ, ölçülemeyen bileşen yok" — `null` ("okunamadı")
     DEĞİL. Zarfı boşaltmak yerine nullamak, bölümün boş durumunu hiç
     çizdirmiyordu (kapı yakaladı). */
  const sistem = useMemo(() => {
    const canli = system.envelope?.data ?? null;
    if (!bos || !canli) return bos ? null : canli;
    return { ...canli, components: [], criticalCount: 0 };
  }, [bos, system.envelope]);

  /** Sahibin hükmünü bekleyen: karara bağlanmamış kayıtlar. */
  const bekleyen = useMemo(
    () => (kuyruk ?? []).filter((d) => !d.decided && d.verdict === null),
    [kuyruk]
  );
  const eylemGerektiren = useMemo(
    () => (alarm ?? []).filter((a) => a.requiresAction),
    [alarm]
  );
  /** Çekirdeğin ölçemediğini bildirdiği bileşenler. */
  const olculemeyen = useMemo(
    () => (sistem?.components ?? []).filter((c) => c.value === null),
    [sistem]
  );

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <WorkspaceHeader
        title="ODIN HQ"
        context="Bugün beni ne bekliyor — detay her zaman kendi ekranında"
        lastSync={system.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Beni bekleyenler"
        description="Her sayı bir listenin uzunluğudur; bileşik bir durum skoru üretilmez."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        <Card>
          <CardBody className="flex flex-col gap-6">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Stat
                label="Hükmümü bekleyen karar"
                value={
                  kuyruk === null ? (
                    <NoData reason="Karar kuyruğu okunamadı" />
                  ) : (
                    <Num value={bekleyen.length} />
                  )
                }
                note="karara bağlanmamış öneri"
              />
              <Stat
                label="Eylem isteyen alarm"
                value={
                  alarm === null ? (
                    <NoData reason="Alarm listesi okunamadı" />
                  ) : (
                    <Num value={eylemGerektiren.length} />
                  )
                }
                note="requires_action bayrağı açık"
              />
              <Stat
                label="Ölçülemeyen bileşen"
                value={
                  sistem === null ? (
                    <NoData reason="Sağlık bileşenleri okunamadı" />
                  ) : (
                    <Num value={olculemeyen.length} />
                  )
                }
                note="çekirdeğin 'ölçemiyorum' dediği"
              />
            </dl>
            <div className="flex flex-wrap gap-4">
              <Gecis href="/decisions" label="Karar merkezi" />
              <Gecis href="/briefing" label="Yönetici brifingi" />
              <Gecis href="/system" label="Sistem sağlığı" />
            </div>
          </CardBody>
        </Card>
      </Section>

      <Section
        title="Sistem nabzı"
        description="Ayrıntı /system ve /system/performance ekranlarında; burada yalnız 'sorun var mı' cevabı."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {sistem && (
          <Card>
            <CardBody className="flex flex-col gap-6">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Stat
                  label="Son olay"
                  value={
                    relativeTime(sistem.lastEventAt, now) ?? (
                      <NoData reason="Olay günlüğü boş" />
                    )
                  }
                  note="çekirdek en son ne zaman bir şey yazdı"
                />
                <Stat
                  label="Kritik bulgu"
                  value={<Num value={sistem.criticalCount} />}
                  note="çekirdeğin kritik saydığı"
                />
                <Stat
                  label="Sağlık kapsamı"
                  value={<Caption>{sistem.coverage}</Caption>}
                  note={`${sistem.measured}/${sistem.expected} bileşen ölçüldü`}
                />
              </dl>
              <div className="flex flex-wrap gap-4">
                <Gecis href="/system/performance" label="Performans" />
                <Gecis href="/automation" label="Otomasyon" />
                <Gecis href="/system/security" label="Güvenlik" />
              </div>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Ölçülemeyenler"
        description="ODIN'in 'bunu ölçemiyorum' dediği her bileşen, gerekçesiyle. Boş bir liste burada iyi haberdir."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={2}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={sistem !== null && olculemeyen.length === 0}
        emptyTitle="Ölçülemeyen bileşen yok"
        emptyDescription="Çekirdeğin beklediği her sağlık bileşeni ölçülmüş."
      >
        {olculemeyen.length > 0 && (
          <Card>
            <CardBody className="flex flex-col gap-2">
              {olculemeyen.map((c) => (
                <div key={c.name} className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" size="xs">
                      {c.name}
                    </Badge>
                  </span>
                  <Text size="sm" tone="tertiary">
                    {c.detail}
                  </Text>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </Section>
    </div>
  );
}
