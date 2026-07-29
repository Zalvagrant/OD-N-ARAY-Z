"use client";

/**
 * Mission Control — "Şu anda ne oluyor?" (05-dashboard.md §5).
 *
 * Executive Briefing gündür; Mission Control andır. Aynı iskelet, aynı
 * bileşenler, farklı soru.
 *
 * PRIMARY FOCUS: Mission Board (03-...md §5). Ekranda ondan daha ağır ikinci
 * bir alan YOKTUR.
 *
 * ⚠️ DOKUZ BÖLÜMÜN ÜÇÜNÜN SÖZLEŞMESİ YOK (UI-ADR-096):
 * Active Projects · Resource Allocation · Automation Queue.
 * Bunlar uydurulmaz; gerekçesi yazılı boş durum gösterirler ve sorular
 * `13-backend-recommendations.md` §14.2'ye düşülmüştür. Boş bir bölüm,
 * uydurulmuş bir bölümden dürüsttür.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { liveness, useNow } from "@/lib/clock/tick";
import { activeTelemetryChannels, TELEMETRY_CHANNELS } from "@/lib/telemetry/registry";
import type { DataEnvelope } from "@/types/data-envelope";
import type { DirectorHeartbeat } from "@/types/executive";
import { directorsMock, risksMock } from "@/mocks/briefing";
import { missionsMock } from "@/mocks/mission-control";
import { MockBadge } from "@/mocks/mock-badge";
import { useMockData } from "@/mocks/use-mock";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { Stat } from "@/components/ui/stat";
import { Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { AlertStack } from "@/components/executive/alert-stack";
import { DirectorCard } from "@/components/executive/director-card";
import { MissionBoard } from "@/components/executive/mission-board";

/* --------------------------------------------------------------------------
   Operational Status — ölçüme dayalı, uydurmasız
   -------------------------------------------------------------------------- */

function OperationalStatus({
  directors,
}: {
  directors: DataEnvelope<DirectorHeartbeat[]> | null;
}) {
  const now = useNow();
  const open = activeTelemetryChannels().length;
  const total = TELEMETRY_CHANNELS.length;

  const states = (directors?.data ?? []).map((d) =>
    liveness(d.lastBeat, d.beatIntervalMs, now)
  );
  const live = states.filter((s) => s === "live").length;
  const offline = states.filter((s) => s === "offline").length;
  const unknown = states.filter((s) => s === "unknown").length;

  return (
    <Card density="compact">
      <CardBody density="compact">
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
          <Stat label="Telemetri kanalı" value={`${open} / ${total}`} note="açık / tanımlı" />
          <Stat label="Canlı Director" value={live} note="son atım eşiğin içinde" tone="success" />
          <Stat label="Offline" value={offline} note="atım gecikti" tone="warning" />
          <Stat
            label="Bilinmiyor"
            value={unknown}
            note="hiç atım yok — ölmüş demek değildir"
            tone="tertiary"
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

  const missions = useMockData(missionsMock);
  const directors = useMockData(directorsMock);
  const alerts = useMockData(risksMock);

  const loading = demo === "loading" || missions.loading;
  const error = demo === "error" ? DEMO_ERROR : null;
  const isEmpty = demo === "empty";

  const reloadAll = () => {
    missions.reload();
    directors.reload();
    alerts.reload();
  };

  const missionEnv = isEmpty && missions.data ? { data: [], meta: missions.data.meta } : missions.data;

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="Mission Control"
        context="Şu anda ne oluyor?"
        lastSync={missions.data?.meta.lastUpdated ?? null}
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
            label="Görev ara"
            placeholder="Görev, hedef veya Director"
            onSearch={setQuery}
            resultCount={
              query ? (missionEnv?.data.length ?? null) : null
            }
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
        title="Mission Board"
        description="Ekranın tek ana odak alanı. Görevler duruma göre ayrılır."
        loading={loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={reloadAll}
      >
        <MissionBoard env={missionEnv} filter={query} />
      </Section>

      <div className="grid gap-8 lg:grid-cols-2 [&>section]:min-w-0">
        <Section
          title="Upcoming Deadlines"
          description="Termini yaklaşan, tamamlanmamış görevler."
          loading={loading}
          loadingLayout="list"
          loadingCount={3}
          error={error}
          onRetry={reloadAll}
          empty={isEmpty || (missionEnv?.data.length ?? 0) === 0}
          emptyTitle="Yaklaşan termin yok"
          emptyDescription="Tanımlı termini olan açık görev bulunmuyor."
        >
          <ul className="flex flex-col gap-2">
            {(missionEnv?.data ?? [])
              .filter((m) => m.status !== "done" && m.deadline)
              .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
              .map((m) => (
                <li
                  key={m.id}
                  className="flex items-baseline justify-between gap-3 border-b border-line-subtle pb-2 last:border-b-0"
                >
                  <span className="min-w-0 truncate text-sm text-content">{m.title}</span>
                  <time
                    dateTime={m.deadline!}
                    className="odin-num shrink-0 text-xs text-content-tertiary"
                  >
                    {new Intl.DateTimeFormat("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                    }).format(new Date(m.deadline!))}
                  </time>
                </li>
              ))}
          </ul>
        </Section>

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
            <DirectorCard key={d.directorId} env={{ data: d, meta: directors.data!.meta }} />
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
