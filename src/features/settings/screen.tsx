"use client";

/**
 * Settings — ODIN'in yapılandırması, SALT OKUNUR (UI-ADR-211).
 *
 * Gece taraması "yazılabilir ayar ucu yok" demişti ve bu DOĞRU. Yanlış
 * olan, bundan "ekran olamaz" sonucunu çıkarmaktı: sahibin "ODIN hangi
 * dizini okuyor, hangi porta bağlı, hangi komutları çalıştırabilir,
 * açılışta başlıyor mu" sorusunun cevabı hiçbir yerde yoktu.
 *
 * KAYDET DÜĞMESİ YOK VE OLMAYACAK. Hiçbir yere yazmayan bir "Kaydet",
 * bu operasyonun avladığı şeyin ta kendisidir (ölü kontrol). Ekranın
 * ilk bölümü neyin DEĞİŞTİRİLEMEYECEĞİNİ ve nasıl değiştirileceğini
 * söyler; gerekçe çekirdekten gelir.
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinSettings } from "@/lib/data/odin-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Caption, Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "Yapılandırma okunamadı",
  "Dizinler, portlar ve komut yüzeyi görüntülenemiyor."
);

function Satir({ label, value, note }: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-1.5 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Caption>{label}</Caption>
        <Mono size="sm">{value}</Mono>
      </div>
      {note ? <Caption>{note}</Caption> : null}
    </div>
  );
}

export function Settings({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const settings = useOdinSettings();

  const zorlama = screenState({
    demo,
    primary: settings,
    sources: [settings],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (settings.error
      ? {
          what: settings.error.what,
          why: settings.error.why,
          impact: settings.error.impact,
          fix: settings.error.fix,
        }
      : null);

  const live = settings.envelope?.data ?? null;
  /** `empty` = "ÖLÇÜLDÜ, ortam değişkeni yok / komut yüzeyi boş". */
  const s =
    zorlama.isEmpty && live
      ? { ...live, allowedCommands: [], envOverrides: [] }
      : live;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <WorkspaceHeader
        title="Settings"
        context="ODIN'in yapılandırması — salt okunur"
        lastSync={settings.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Neden burada Kaydet düğmesi yok"
        description="Ekranın ilk bilgisi, yapamadığı şeydir."
        loading={zorlama.loading}
        loadingLayout="card"
        loadingCount={1}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {s && (
          <Card>
            <CardBody className="flex flex-col gap-2">
              <Badge variant="secondary" size="xs">
                Salt okunur
              </Badge>
              <Text>{s.writableReason}</Text>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Çalışma zamanı"
        description="Hangi porta bağlı, hangi ritimde atıyor, ne zaman ölü sayılıyor."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {s && (
          <Card>
            <CardBody>
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <Stat
                  label="Cockpit portu"
                  value={<Num value={s.cockpitPort} />}
                  note={`${s.bindHost} — yalnız yerel`}
                />
                <Stat
                  label="Arayüz portu"
                  value={<Num value={s.uiPort} />}
                  note="üretim sunucusu"
                />
                <Stat
                  label="Heartbeat"
                  value={
                    <>
                      <Num value={s.heartbeatTickS} /> sn
                    </>
                  }
                  note={`${s.staleThresholdS} sn sonra bayat sayılır`}
                />
                <Stat
                  label="Açılışta başlat"
                  value={
                    <Badge
                      variant={s.autostartInstalled ? "success" : "warning"}
                      size="xs"
                    >
                      {s.autostartInstalled ? "Kurulu" : "Kurulu değil"}
                    </Badge>
                  }
                  note="logon → watchdog → runtime"
                />
              </dl>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Dizinler"
        description="ODIN'in okuduğu ve yazdığı yerler; her satır kaynağını da söyler."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {s && (
          <Card>
            <CardBody className="flex flex-col gap-0">
              <Satir
                label="Veri dizini"
                value={s.dataDir}
                note={`kaynak: ${s.dataDirSource}`}
              />
              <Satir label="Depo" value={s.repo} />
              <Satir
                label="Arayüz dizini"
                value={s.uiDir ?? "bulunamadı"}
                note={`kaynak: ${s.uiDirSource}`}
              />
              <Satir label="Açılış betiği" value={s.autostartCmd} />
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Komut yüzeyi"
        description="Konsolun çalıştırabileceği TÜM fiiller. Bu liste aynı zamanda saldırı yüzeyidir (ADR-0028)."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={s !== null && s.allowedCommands.length === 0}
        emptyTitle="Komut yüzeyi boş"
        emptyDescription="Konsol hiçbir komutu çalıştıramıyor."
      >
        {s && s.allowedCommands.length > 0 && (
          <Card>
            <CardBody className="flex flex-wrap gap-2">
              {s.allowedCommands.map((c) => (
                <Badge key={c} variant="secondary" size="xs">
                  {c}
                </Badge>
              ))}
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Ortam değişkenleri"
        description="Yapılandırmayı EZEBİLEN değişkenler. Ayarların değiştirilme yolu budur — ekran değil."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={s !== null && s.envOverrides.length === 0}
        emptyTitle="Tanımlı ezme yok"
        emptyDescription="Çekirdek hiçbir ortam değişkeni bildirmiyor."
      >
        {s && s.envOverrides.length > 0 && (
          <Card>
            <CardBody className="flex flex-col gap-0">
              {s.envOverrides.map((e) => (
                <Satir
                  key={e.name}
                  label={e.name}
                  value={e.set ? (e.value ?? "") : "ayarlı değil"}
                  note={e.set ? "bu değişken ezme yapıyor" : undefined}
                />
              ))}
            </CardBody>
          </Card>
        )}
      </Section>

      {settings.envelope && (
        <TrustSignal
          meta={settings.envelope.meta}
          refreshFailed={settings.refreshError?.what}
        />
      )}
    </div>
  );
}
