"use client";

/**
 * Executive Briefing — ODIN'in açılış ekranı (05-dashboard.md §3).
 *
 * Bu bir dashboard değil, bir BRİFİNGDİR. Dikey sıra §2'de dondurulmuştur:
 *   Kararlar → Riskler → Fırsatlar → (bekleyen onaylar) → AI tavsiyesi
 * Kararlar her zaman en üsttedir.
 *
 * ATTENTION ECONOMY: ekranda TEK Hero vardır (aşağıdaki `Hero`), en fazla üç
 * primary karar kartı gösterilir (DecisionQueue `limit`), gerisi sayısıyla
 * bildirilir. KPI'lar, Director'lar ve timeline destekleyicidir.
 *
 * VERİ: hepsi mock (`meta.source === "mock"`, UI-ADR-094). Gerçek veri S8.
 * Mock bile olsa anti-fake geçerlidir: ölçüm kaynağı olmayan KPI değer
 * göstermez, sözleşmesi olmayan alan (AI Readiness) NoData çıkar.
 */

import { useState } from "react";
import type { Decision } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import type { ExecutiveHero } from "@/types/screens";
import { useNow } from "@/lib/clock/tick";
import { MockBadge } from "@/components/ui/mock-badge";
import { greeting } from "@/features/executive/presentation/greeting";
import { useOdinFixture } from "@/lib/data/odin-fixture";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Timeline } from "@/components/ui/timeline";
import { Heading, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { AIBrief } from "@/components/executive/ai-brief";
import { AIPulse } from "@/components/executive/ai-pulse";
import { AIRecommendationView } from "@/components/executive/ai-recommendation-card";
import { AlertStack } from "@/components/executive/alert-stack";
import { ConfidenceBadge } from "@/components/executive/confidence-badge";
import { DataGuard } from "@/components/executive/data-guard";
import { DecisionQueue } from "@/components/executive/decision-queue";
import type { VerdictInput } from "@/components/executive/decision-card";
import { DirectorCard } from "@/components/executive/director-card";
import { ExecutiveKPICard } from "@/components/executive/executive-kpi-card";
import { SystemReadiness } from "@/components/executive/system-readiness";
import { TrustSignal } from "@/components/executive/trust-signal";

/* --------------------------------------------------------------------------
   Hero — 05-dashboard.md §3.1. Ekranın TEK Hero Element'i.
   -------------------------------------------------------------------------- */

function HeroView({ hero, meta }: { hero: ExecutiveHero; meta: DataMeta }) {
  const now = useNow();
  const hello = greeting(now);

  return (
    <Card tone="ai">
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <Heading level={1} size={1}>
            {hello ?? "Executive Briefing"}
          </Heading>
          <ConfidenceBadge meta={meta} label="Brifing güveni" size="md" />
        </div>

        <Text size="md" className="max-w-3xl">
          {hero.executiveSummary}
        </Text>

        {/* min-w-0: uzun metinler grid hücresini şişirip komşusunun üstüne
            binmesin (S4'te görsel incelemede yakalanan hata). */}
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
          <div>
            <dt className="text-xs uppercase tracking-wide text-content-tertiary">
              Today&apos;s Mission
            </dt>
            <dd className="mt-1 text-sm text-content">
              {hero.todaysMission ?? <NoData reason="Günün hedefi belirlenmedi" />}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-content-tertiary">
              Current Focus
            </dt>
            <dd className="mt-1 text-sm text-content">
              {hero.currentFocus ?? <NoData reason="Odak konusu belirlenmedi" />}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-content-tertiary">
              System Status
            </dt>
            <dd className="mt-1">
              <Num
                value={hero.systemHealthScore}
                size="lg"
                noDataReason="Sistem sağlık skoru ölçülmedi"
              />
              <span className="ml-1 text-xs text-content-tertiary">/ 100</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-content-tertiary">
              AI Readiness
            </dt>
            <dd className="mt-1">
              {/* Sözleşmede karşılığı YOK — uydurulmaz (13-...md §14.1). */}
              <Num
                value={hero.aiReadiness}
                size="lg"
                noDataReason="AI hazırlık göstergesi henüz üretilmiyor (13-backend-recommendations.md §14.1)"
              />
            </dd>
          </div>
        </dl>
      </CardBody>

      <CardFooter>
        <TrustSignal meta={meta} />
      </CardFooter>
    </Card>
  );
}

/* --------------------------------------------------------------------------
   Ekran
   -------------------------------------------------------------------------- */

const DEMO_ERROR: SectionError = {
  what: "Brifing verisi yüklenemedi",
  why: "ODIN yerel sunucusu (127.0.0.1) yanıt vermedi.",
  impact: "Bugünün kararları, riskleri ve KPI'ları güncel değil; onay verilmemeli.",
  fix: "ODIN sunucusunu başlat, sonra yeniden dene.",
};

function empty<T>(env: DataEnvelope<T[]> | null): DataEnvelope<T[]> | null {
  return env ? { data: [], meta: env.meta } : null;
}

export function ExecutiveBriefing({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: "loading" | "empty" | "error";
}) {
  const [verdicts, setVerdicts] = useState<Record<string, VerdictInput>>({});

  const hero = useOdinFixture("briefing.hero");
  const decisions = useOdinFixture("briefing.decisions");
  const risks = useOdinFixture("briefing.risks");
  const opportunities = useOdinFixture("briefing.opportunities");
  const kpis = useOdinFixture("briefing.kpis");
  const brief = useOdinFixture("briefing.brief");
  const directors = useOdinFixture("briefing.directors");
  const timeline = useOdinFixture("briefing.timeline");
  const pulse = useOdinFixture("briefing.pulse");

  const loading = demo === "loading" || hero.loading;
  const error = demo === "error" ? DEMO_ERROR : null;
  const isEmpty = demo === "empty";

  const reloadAll = () => {
    hero.refetch();
    decisions.refetch();
    risks.refetch();
    opportunities.refetch();
    kpis.refetch();
    brief.refetch();
    directors.refetch();
    timeline.refetch();
    pulse.refetch();
  };

  /* Verdict S7'de POST /api/command'a bağlanacak (ER-0025). Şimdilik
     oturum içi işaretlenir ve KAYDEDILMEDIGI açıkça yazılır. */
  const onVerdict = (d: Decision, v: VerdictInput) =>
    setVerdicts((m) => ({ ...m, [d.id]: v }));

  return (
    /* Okunabilir satır uzunluğu korunur: ultrawide'da içerik gerilmez
       (03-...md §9.4). */
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="Executive Briefing"
        context="Bugün neye karar vermeliyim?"
        lastSync={hero.envelope?.meta.lastUpdated ?? null}
        actions={
          <>
            <MockBadge />
            <Button variant="tertiary" size="sm" onClick={reloadAll}>
              Yenile
            </Button>
          </>
        }
      />

      {/* 0–3 sn — sistem hazır olduğunu sessizce bildirir */}
      <SystemReadiness />

      {/* Hero — ekranın tek hero element'i */}
      {loading ? (
        <Section title="Executive Summary" loading loadingLayout="card" loadingCount={3} />
      ) : error ? (
        <Section title="Executive Summary" error={error} onRetry={reloadAll} />
      ) : (
        <DataGuard env={hero.envelope} reason="Brifing özeti üretilmedi">
          {(data, meta) => <HeroView hero={data} meta={meta} />}
        </DataGuard>
      )}

      {/* 1 — Kararlar her zaman en üstte */}
      <Section
        title="Kritik kararlar"
        description="Onay senden. Karar kartından doğrudan onaylayabilirsin."
        loading={loading}
        loadingLayout="card"
        loadingCount={4}
        error={error}
        onRetry={reloadAll}
      >
        <DecisionQueue
          env={isEmpty ? empty(decisions.envelope) : decisions.envelope}
          limit={3}
          onVerdict={onVerdict}
        />
        {Object.keys(verdicts).length > 0 && (
          <Text size="sm" tone="tertiary" className="mt-3">
            {Object.keys(verdicts).length} verdict bu oturumda işaretlendi.
            Kayıt S7&apos;de `ceo verdict` üzerinden kalıcı olacak (ER-0025) —
            şu an HİÇBİR YERE yazılmadı.
          </Text>
        )}
      </Section>

      {/* 2 + 3 — Risk ve fırsat EŞİT görsel ağırlıkta: aynı grid, aynı genişlik */}
      <div className="grid gap-8 lg:grid-cols-2 [&>section]:min-w-0">
        <Section
          title="Kritik riskler"
          description="Yalnızca aksiyon gerektirenler listelenir."
          loading={loading}
          loadingLayout="list"
          loadingCount={4}
          error={error}
          onRetry={reloadAll}
        >
          {/* Kart başlığı FİLTRE KURALINI söyler; boş bırakılırsa kartın
              üstünde boş bir şerit kalır ve eleme kuralı görünmez olur. */}
          <AlertStack
            env={isEmpty ? empty(risks.envelope) : risks.envelope}
            title="Aksiyon gerektirenler"
          />
        </Section>

        <Section
          title="Fırsatlar"
          description="Ölçülmüş büyüme fırsatları — risklerle eşit ağırlıkta."
          loading={loading}
          loadingLayout="list"
          loadingCount={4}
          error={error}
          onRetry={reloadAll}
          empty={isEmpty}
          emptyTitle="Fırsat üretilmedi"
          emptyDescription="Bu dönem için ölçülmüş bir büyüme fırsatı yok."
        >
          {/* ADR-0143 §3: fırsat AYRI KAYIT DEĞİL — öneri kayıtlarının
              görünümüdür. Bu yüzden mevcut `AIRecommendationView` kullanılır;
              icat edilmiş OpportunityCard silindi. Pozitif sınıfı hangi
              kayıtlı alanın işaretlediği ODIN'de bildirilmedi, bu yüzden
              FİLTRE UYGULANMIYOR ve bu durum ekranda yazılı. */}
          <div className="flex flex-col gap-4">
            {opportunities.envelope?.data.map((r) => (
              <div key={r.id} className="odin-ai-region p-3">
                <AIRecommendationView rec={r} compact />
              </div>
            ))}
            <Text size="sm" tone="tertiary">
              Fırsatlar öneri kayıtlarının görünümüdür (ADR-0143 §3). Pozitif
              sınıfı işaretleyen alan ODIN&apos;de henüz bildirilmediği için
              liste filtrelenmiyor — soru 13-...md §17&apos;de.
            </Text>
          </div>
        </Section>
      </div>

      {/* 4 — Executive KPI'lar (05-...md §3.5'teki dokuz kalem) */}
      <Section
        title="Executive KPI'lar"
        description="Kapalıyken sade, açıkken mini rapor. Ölçüm kaynağı olmayan metrik değer göstermez."
        loading={loading}
        loadingLayout="kpi"
        loadingCount={8}
        error={error}
        onRetry={reloadAll}
        empty={isEmpty}
        emptyTitle="KPI üretilmedi"
        emptyDescription="Hiçbir metrik hesaplanamadı."
      >
        {/* KPI kolonu ~260px altına inemez: `text-3xl` bir para değeri
            (₺1.284.000,00) o genişliğe sığmaz ve kartın dışına taşar.
            768px'te ölçüldü (S6 görsel incelemesi) — bu yüzden ikinci kolon
            `md` değil `lg`de açılır. */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          {kpis.envelope?.data.map((k) => (
            <ExecutiveKPICard key={k.id} env={{ data: k, meta: kpis.envelope!.meta }} />
          ))}
        </div>
      </Section>

      {/* 5 — AI tavsiyesi */}
      <Section
        title="AI brifingi"
        description="Önce sayı, sonra yorum: Evidence Before Opinion."
        loading={loading}
        loadingLayout="card"
        loadingCount={5}
        error={error}
        onRetry={reloadAll}
      >
        <AIBrief env={isEmpty ? null : brief.envelope} />
      </Section>

      {/* 6 — Director aktivitesi (UI-ADR-074 ile dondurulmuş 6 Director) */}
      <Section
        title="Director aktivitesi"
        description="Executive · Amazon · Finance · Trading · Knowledge · Reasoning"
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
          {directors.envelope?.data.map((d) => (
            <DirectorCard
              key={d.agentId}
              env={{ data: d, meta: directors.envelope!.meta }}
            />
          ))}
        </div>
      </Section>

      {/* 7 + 8 — Timeline ve AI Core */}
      <div className="grid gap-8 lg:grid-cols-2 [&>section]:min-w-0">
        <Section
          title="Executive Timeline"
          description="Son yönetici olayları."
          loading={loading}
          loadingLayout="list"
          loadingCount={5}
          error={error}
          onRetry={reloadAll}
        >
          <Timeline items={isEmpty ? [] : (timeline.envelope?.data ?? [])} />
          {timeline.envelope && !isEmpty && (
            <TrustSignal meta={timeline.envelope.meta} className="mt-3" />
          )}
        </Section>

        <Section
          title="AI Core"
          description="Yalnızca ölçülebilir kanallar çizilir (UI-ADR-071)."
          loading={loading}
          loadingLayout="card"
          loadingCount={2}
          error={error}
          onRetry={reloadAll}
        >
          <AIPulse env={isEmpty ? null : pulse.envelope} />
        </Section>
      </div>
    </div>
  );
}
