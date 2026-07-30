"use client";

/**
 * Mission Control — "Şu anda ne oluyor?" (05-dashboard.md §5).
 *
 * Executive Briefing gündür; Mission Control andır. Aynı iskelet, aynı
 * bileşenler, farklı soru.
 *
 * PRIMARY FOCUS: Goal Board (03-...md §5; Mission → Goal, ODIN ADR-0132 ·
 * UI-ADR-107). Ekranda ondan daha ağır ikinci bir alan YOKTUR.
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
import { goalsMock } from "@/mocks/mission-control";
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
import { GoalBoard } from "@/components/executive/goal-board";

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

  const goals = useMockData(goalsMock);
  const directors = useMockData(directorsMock);
  const alerts = useMockData(risksMock);

  const loading = demo === "loading" || goals.loading;
  const error = demo === "error" ? DEMO_ERROR : null;
  const isEmpty = demo === "empty";

  const reloadAll = () => {
    goals.reload();
    directors.reload();
    alerts.reload();
  };

  const goalEnv = isEmpty && goals.data ? { data: [], meta: goals.data.meta } : goals.data;

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="Mission Control"
        context="Şu anda ne oluyor?"
        lastSync={goals.data?.meta.lastUpdated ?? null}
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
            label="Hedef ara"
            placeholder="Hedef, seviye veya başlık"
            onSearch={setQuery}
            resultCount={
              query ? (goalEnv?.data.length ?? null) : null
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
        title="Goal Board"
        description="Ekranın tek ana odak alanı. Hedefler ODIN'in gerçek seviye alanına göre gruplanır (ADR-0132)."
        loading={loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={reloadAll}
      >
        <GoalBoard env={goalEnv} filter={query} />
      </Section>

      <div className="grid gap-8 lg:grid-cols-2 [&>section]:min-w-0">
        {/* Mission emekli edilince (ADR-0132) `deadline` alanı da düştü —
            ODIN'in Goal yayınında termin YOK. Termin uydurulmaz; kaynak
            sorusu 13-...md §14.2'de. */}
        <Section
          title="Upcoming Deadlines"
          empty
          emptyTitle="Termin verisinin kaynağı yok"
          emptyDescription="Mission tipi Goal'e emekli edildi (ODIN ADR-0132) ve ODIN'in Goal yayınında termin alanı bulunmuyor. Uydurulmuş tarih göstermek yerine bölüm boş bırakıldı."
          emptySuggestion="Soru 13-backend-recommendations.md §14.2'ye düşüldü; ODIN termin yayınlarsa bölüm aynı yere oturur."
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
