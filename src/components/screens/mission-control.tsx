"use client";

/**
 * Mission Control — "Şu anda ne oluyor?" (05-dashboard.md §5).
 *
 * Executive Briefing gündür; Mission Control andır. Aynı iskelet, aynı
 * bileşenler, farklı soru.
 *
 * PRIMARY FOCUS: **İzlenen kararlar + vadesi gelen ertelemeler** (03-...md §5).
 * "Mission" kavramı ODIN ADR-0143 §4 ile REDDEDİLDİ; tahta artık gerçek
 * karar kayıtlarının görünümüdür. Ekranda ondan ağır ikinci bir alan yoktur.
 *
 * ⚠️ DOKUZ BÖLÜMÜN ÜÇÜNÜN SÖZLEŞMESİ YOK (UI-ADR-096):
 * Active Projects · Resource Allocation · Automation Queue.
 * Bunlar uydurulmaz; gerekçesi yazılı boş durum gösterirler ve sorular
 * `13-backend-recommendations.md` §14.2'ye düşülmüştür. Boş bir bölüm,
 * uydurulmuş bir bölümden dürüsttür.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { activeTelemetryChannels, TELEMETRY_CHANNELS } from "@/lib/telemetry/registry";
import {
  useOdinDirectors,
  type RuntimeDirectorParsed,
} from "@/lib/data/odin-state";
import { MockBadge } from "@/components/ui/mock-badge";
import {
  demoError,
  emptied,
  noContract,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinFixture } from "@/lib/data/odin-fixture";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { Text } from "@/components/ui/typography";
import { Section } from "@/components/layout/section";
import type { DataEnvelope } from "@/types/data-envelope";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { AlertStack } from "@/components/executive/alert-stack";
import { RuntimeDirectorCard } from "@/components/executive/runtime-director-card";
import { MonitoredDecisionsBoard } from "@/components/executive/monitored-decisions-board";

/* --------------------------------------------------------------------------
   Operational Status — ölçüme dayalı, uydurmasız
   -------------------------------------------------------------------------- */

function Stat({
  label,
  value,
  note,
  tone = "text-content",
}: {
  label: string;
  value: number | string;
  note: string;
  tone?: string;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-content-tertiary">{label}</dt>
      <dd className="mt-1">
        <span className={`odin-num text-lg ${tone}`}>{value}</span>
      </dd>
      <p className="text-xs text-content-tertiary">{note}</p>
    </div>
  );
}

function OperationalStatus({
  directors,
}: {
  directors: DataEnvelope<RuntimeDirectorParsed[]> | null;
}) {
  const open = activeTelemetryChannels().length;
  const total = TELEMETRY_CHANNELS.length;

  /* Sayım ODIN'in `status`una dayanır — UI canlılık eşiği TÜRETMEZ
     (UI-ADR-111; eski beatIntervalMs×3 kuralı UI icadıydı).
     ODIN ADR-0148 ile DÖRT durum var ve dördü de ayrı sayılır:
     `stale`i `failed` ile toplamak, gecikmiş bir işi hata vermiş gibi
     göstermek olurdu — sahibin görmesi gereken fark tam olarak budur. */

  /*
   * KAYNAK YOKSA SAYI DA YOK — S8 (UI-ADR-120).
   *
   * Burada `directors?.data ?? []` vardı: zarf `null` olduğunda boş diziye
   * düşüyor ve üç sayaç da `0` çıkıyordu. Ekranda "0 sağlıksız Director"
   * bir ÖLÇÜMDÜR ve yanlıştır — doğrusu "ölçülmedi". Aradaki fark, sistemin
   * sağlıklı mı yoksa hiç izlenmiyor mu olduğudur; sıfırlarla dolu bir
   * tablo "her şey yolunda" diye okunur.
   *
   * Gerçek moda geçilince (mock kancası fail-closed olduğu için) tam olarak
   * bu görüldü. Hiçbir test yakalamadı, ekrana bakılarak bulundu.
   */
  const measured = directors?.data ?? null;
  const statuses = (measured ?? []).map((d) => d.status);
  const count = (v: RuntimeDirectorParsed["status"]) =>
    measured === null ? "—" : statuses.filter((x) => x === v).length;
  const note = (measuredNote: string) =>
    measured === null ? "kaynak bağlı değil — ölçülmedi" : measuredNote;

  return (
    <Card density="compact">
      <CardBody density="compact">
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
          {/* `odin-num` blok elemana verilmez: sınıf sayıları SAĞA hizalar
              (03-...md §11) ve etiketinden koparır. */}
          <Stat label="Telemetri kanalı" value={`${open} / ${total}`} note="açık / tanımlı" />
          <Stat
            label="Sağlıklı Director"
            value={count("healthy")}
            note={note("ODIN status: healthy")}
            tone="text-success"
          />
          <Stat
            label="Hatalı"
            value={count("failed")}
            note={note("ODIN status: failed")}
            tone="text-danger"
          />
          <Stat
            label="Gecikmiş"
            value={count("stale")}
            note={note("beklenen ritmi kaçırdı — hata vermiş değil")}
            tone="text-warning"
          />
          <Stat
            label="Bilinmiyor"
            value={count("unknown")}
            note={note("hiç gözlem yok — ölmüş demek değildir")}
            tone="text-content-tertiary"
          />
        </dl>
      </CardBody>
    </Card>
  );
}

/* --------------------------------------------------------------------------
   Ekran
   -------------------------------------------------------------------------- */

const NO_CONTRACT_WHY =
  "09-data-contracts.md bu bölüm için bir veri sözleşmesi içermiyor. Uydurulmuş bir liste göstermek yerine boş bırakıldı.";

const DEMO_ERROR = demoError(
  "Operasyon verisi yüklenemedi",
  "Görev tahtası ve Director koordinasyonu güncel değil."
);


export function MissionControl({
  demo,
}: {
  demo?: DemoState;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const decisions = useOdinFixture("briefing.decisions");
  /* CANLI — ODIN ADR-0148 (UI-ADR-127). Bu bölüm artık ZAMANLANMIŞ
     runtime işlerini gösteriyor, görev-kuyruğu ajanlarını değil: kuyruk
     hiç kullanılmadı (`agents` boş), oysa 18 iş heartbeat üstünde
     koşuyor. Sahibin sorusunu ("ODIN yaşıyor mu?") cevaplayan yüzey bu. */
  const directors = useOdinDirectors();
  const alerts = useOdinFixture("briefing.risks");

  const { loading, error, isEmpty, reloadAll } = screenState({
    demo,
    primary: decisions,
    sources: [decisions, directors, alerts],
    error: DEMO_ERROR,
  });

  const decisionEnv = isEmpty ? emptied(decisions.envelope) : decisions.envelope;

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="Mission Control"
        context="Şu anda ne oluyor?"
        lastSync={decisions.envelope?.meta.lastUpdated ?? null}
        actions={
          <>
            <MockBadge />
            <Button variant="tertiary" size="sm" onClick={reloadAll}>
              Yenile
            </Button>
          </>
        }
        search={
          <Search
            label="Karar ara"
            placeholder="Karar sorusu"
            onSearch={setQuery}
            resultCount={query ? (decisionEnv?.data.length ?? null) : null}
          />
        }
      />

      {/* Operasyonel farkındalık — tahtadan önce tek satırlık durum */}
      <Section
        title="Operational Status"
        description="Sayılar registry ve heartbeat ölçümünden gelir; hiçbiri tahmin değildir."
        loading={loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={reloadAll}
      >
        <OperationalStatus directors={isEmpty ? null : directors.envelope} />
      </Section>

      {/* PRIMARY FOCUS AREA */}
      <Section
        title="İzlenen kararlar + vadesi gelen ertelemeler"
        description="Ekranın tek ana odak alanı. Kaynak: status=monitoring kararlar ve vadesi gelmiş ertelemeler (ODIN ADR-0143 §4) — icat edilmiş görev kavramı yok."
        loading={loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={reloadAll}
      >
        <MonitoredDecisionsBoard env={decisionEnv} filter={query} />
      </Section>

      <div className="grid gap-8 lg:grid-cols-2 [&>section]:min-w-0">
        {/* ADR-0143 §4: "Upcoming Deadlines" kaynaksız kaldı. Mission
            kavramıyla birlikte `deadline` alanı da düştü; ertelemelerin
            vadesi zaten ana tahtada. Uydurulmuş bir termin listesi yerine
            gerekçeli boş durum. */}
        <Section
          title="Upcoming Deadlines"
          empty
          emptyTitle="Termin verisinin kaynağı yok"
          emptyDescription="ODIN ADR-0143 §4 ile Mission kavramı reddedildi; karar kayıtlarında genel bir termin alanı yok. Vadesi gelen ertelemeler ana tahtada listelenir."
          emptySuggestion="Soru 13-backend-recommendations.md §17'ye düşüldü; ODIN termin yayınlarsa bölüm aynı yere oturur."
        />

        <Section
          title="Executive Alerts"
          description="Yalnızca aksiyon gerektirenler."
          loading={loading}
          loadingLayout="list"
          loadingCount={4}
          error={error}
          onRetry={reloadAll}
        >
          <AlertStack
            env={isEmpty ? emptied(alerts.envelope) : alerts.envelope}
          />
        </Section>
      </div>

      <Section
        title="Director Coordination"
        description="Kim ne üzerinde çalışıyor, kim bekliyor."
        loading={loading}
        loadingLayout="list"
        loadingCount={6}
        error={error}
        onRetry={reloadAll}
        empty={isEmpty}
        emptyTitle="Director verisi yok"
        emptyDescription="ODIN hiçbir zamanlanmış iş bildirmedi."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          {directors.envelope?.data.map((d) => (
            <RuntimeDirectorCard
              key={d.id}
              env={{ data: d, meta: directors.envelope!.meta }}
            />
          ))}
        </div>
      </Section>

      {/* Sözleşmesi olmayan üç bölüm — UI-ADR-096 */}
      <div className="grid gap-8 xl:grid-cols-3 [&>section]:min-w-0">
        <Section
          title="Active Projects"
          empty
          {...noContract(
            "Project",
            NO_CONTRACT_WHY,
            "13-backend-recommendations.md §14.2"
          )}
        />
        <Section
          title="Resource Allocation"
          empty
          {...noContract(
            "ResourceAllocation",
            NO_CONTRACT_WHY,
            "13-backend-recommendations.md §14.2"
          )}
        />
        <Section
          title="Automation Queue"
          empty
          {...noContract(
            "AutomationQueue",
            NO_CONTRACT_WHY,
            "13-backend-recommendations.md §14.2"
          )}
        />
      </div>

      <Text size="sm" tone="tertiary">
        Karar detayına geçmek için{" "}
        <button
          type="button"
          className="text-ai-text underline"
          onClick={() => router.push("/decisions")}
        >
          Decision Center
        </button>
        .
      </Text>
    </div>
  );
}

