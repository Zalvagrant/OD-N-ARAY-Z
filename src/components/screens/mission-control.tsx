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
import type { DataEnvelope } from "@/types/data-envelope";
import type { AgentHealth } from "@/types/executive";
import { decisionsMock, directorsMock, risksMock } from "@/mocks/briefing";
import { MockBadge } from "@/mocks/mock-badge";
import { useMockData } from "@/mocks/use-mock";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { AlertStack } from "@/components/executive/alert-stack";
import { DirectorCard } from "@/components/executive/director-card";
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
  directors: DataEnvelope<AgentHealth[]> | null;
}) {
  const open = activeTelemetryChannels().length;
  const total = TELEMETRY_CHANNELS.length;

  /* Sayım ODIN'in verdict'ine dayanır — UI canlılık eşiği TÜRETMEZ
     (UI-ADR-111; eski beatIntervalMs×3 kuralı UI icadıydı). */
  const verdicts = (directors?.data ?? []).map((d) => d.verdict);
  const healthy = verdicts.filter((v) => v === "healthy").length;
  const unhealthy = verdicts.filter((v) => v === "unhealthy").length;
  const unknown = verdicts.filter((v) => v === "unknown").length;

  return (
    <Card density="compact">
      <CardBody density="compact">
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
          {/* `odin-num` blok elemana verilmez: sınıf sayıları SAĞA hizalar
              (03-...md §11) ve etiketinden koparır. */}
          <Stat label="Telemetri kanalı" value={`${open} / ${total}`} note="açık / tanımlı" />
          <Stat label="Sağlıklı Director" value={healthy} note="ODIN verdict: healthy" tone="text-success" />
          <Stat label="Sağlıksız" value={unhealthy} note="ODIN verdict: unhealthy" tone="text-warning" />
          <Stat
            label="Bilinmiyor"
            value={unknown}
            note="hiç gözlem yok — ölmüş demek değildir"
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

const DEMO_ERROR: SectionError = {
  what: "Operasyon verisi yüklenemedi",
  why: "ODIN yerel sunucusu (127.0.0.1) yanıt vermedi.",
  impact: "Görev tahtası ve Director koordinasyonu güncel değil.",
  fix: "ODIN sunucusunu başlat, sonra yeniden dene.",
};

/** Sözleşmesi olmayan bölümlerin ortak metni — UI-ADR-096. */
const NO_CONTRACT = (name: string, ref: string) => ({
  title: `${name} sözleşmesi tanımlı değil`,
  description: `09-data-contracts.md bu bölüm için bir veri sözleşmesi içermiyor. Uydurulmuş bir liste göstermek yerine boş bırakıldı.`,
  suggestion: `Soru ${ref}'e düşüldü; sözleşme geldiğinde bölüm aynı yere oturur.`,
});

export function MissionControl({
  demo,
}: {
  demo?: "loading" | "empty" | "error";
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const decisions = useMockData(decisionsMock);
  const directors = useMockData(directorsMock);
  const alerts = useMockData(risksMock);

  const loading = demo === "loading" || decisions.loading;
  const error = demo === "error" ? DEMO_ERROR : null;
  const isEmpty = demo === "empty";

  const reloadAll = () => {
    decisions.reload();
    directors.reload();
    alerts.reload();
  };

  const decisionEnv =
    isEmpty && decisions.data ? { data: [], meta: decisions.data.meta } : decisions.data;

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="Mission Control"
        context="Şu anda ne oluyor?"
        lastSync={decisions.data?.meta.lastUpdated ?? null}
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
        <OperationalStatus directors={isEmpty ? null : directors.data} />
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
            env={isEmpty && alerts.data ? { data: [], meta: alerts.data.meta } : alerts.data}
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
        emptyDescription="Heartbeat servisi bağlı değil."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          {directors.data?.data.map((d) => (
            <DirectorCard key={d.agentId} env={{ data: d, meta: directors.data!.meta }} />
          ))}
        </div>
      </Section>

      {/* Sözleşmesi olmayan üç bölüm — UI-ADR-096 */}
      <div className="grid gap-8 xl:grid-cols-3 [&>section]:min-w-0">
        <Section
          title="Active Projects"
          empty
          {...emptyProps(NO_CONTRACT("Project", "13-backend-recommendations.md §14.2"))}
        />
        <Section
          title="Resource Allocation"
          empty
          {...emptyProps(NO_CONTRACT("ResourceAllocation", "13-backend-recommendations.md §14.2"))}
        />
        <Section
          title="Automation Queue"
          empty
          {...emptyProps(NO_CONTRACT("AutomationQueue", "13-backend-recommendations.md §14.2"))}
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

function emptyProps(v: { title: string; description: string; suggestion: string }) {
  return {
    emptyTitle: v.title,
    emptyDescription: v.description,
    emptySuggestion: v.suggestion,
  };
}
