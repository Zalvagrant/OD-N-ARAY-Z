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
import { relativeTime, useNow } from "@/lib/clock/tick";
import { useOdinAlerts, useOdinOpportunities } from "@/lib/data/odin-state";
import { MockBadge } from "@/mocks/mock-badge";
import { useMockData } from "@/mocks/use-mock";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Timeline } from "@/components/ui/timeline";
import { Heading, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { AIBrief } from "@/components/executive/ai-brief";
import { AIPulse } from "@/components/executive/ai-pulse";
import { AlertStack } from "@/components/executive/alert-stack";
import { Badge } from "@/components/ui/badge";
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

/** Saat istemciden gelir; gelmeden selamlama YAZILMAZ (uydurma yok). */
function greeting(now: number | null): string | null {
  if (now === null) return null;
  const h = new Date(now).getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

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
  const now = useNow();

  const hero = useMockData("briefing.hero");
  const decisions = useMockData("briefing.decisions");
  /* CANLI — `/api/state.alerts` (S10 · G3). `useOdinAlerts` bu mock
     anahtarının tayin edilmiş karşılığıydı ve zaten yazılıydı; yeni
     kanca yazılmadı. Liste bugün BOŞ ve doğru cevap bu: çalışma
     zamanında alarm yok. `risks` AYRI bir kavram, buraya girmez. */
  const risks = useOdinAlerts();
  /* CANLI — ODIN ADR-0154 (UI-ADR-141). Fırsat AYRI KAYIT DEĞİL: ODIN
     mevcut iyileştirme kayıtları üzerinde bir GÖRÜNÜM yayınlıyor. Filtre
     (`detected` + uygulanabilir adım) ve sıralama ODIN'de; arayüz ikisini
     de icat etmiyor. */
  const opportunities = useOdinOpportunities();
  const kpis = useMockData("briefing.kpis");
  const brief = useMockData("briefing.brief");
  const directors = useMockData("briefing.directors");
  const timeline = useMockData("briefing.timeline");
  const pulse = useMockData("briefing.pulse");

  const loading = demo === "loading" || hero.loading;
  const error = demo === "error" ? DEMO_ERROR : null;
  const isEmpty = demo === "empty";

  const reloadAll = () => {
    hero.reload();
    decisions.reload();
    risks.refetch();
    opportunities.refetch();
    kpis.reload();
    brief.reload();
    directors.reload();
    timeline.reload();
    pulse.reload();
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
        lastSync={hero.data?.meta.lastUpdated ?? null}
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
        <DataGuard env={hero.data} reason="Brifing özeti üretilmedi">
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
          env={isEmpty ? empty(decisions.data) : decisions.data}
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
          error={error ?? opportunities.error?.toErrorState() ?? null}
          onRetry={reloadAll}
          empty={isEmpty || opportunities.envelope?.data.length === 0}
          emptyTitle="Açık fırsat yok"
          emptyDescription="ODIN'in açık iyileştirme kaydı yok. Boşalan bir liste doğru cevaptır — hiç boşalmayan liste birikmiş iş demektir."
        >
          {/* ADR-0143 §3 fırsatı ayrı kayıt olarak reddetti; ADR-0154 o
              şartı karşılayarak GÖRÜNÜMÜ yayınladı. Bu yüzden burada
              icat edilmiş bir OpportunityCard yok: gelen zarf olduğu gibi
              basılıyor. `AIRecommendationView` KULLANILMIYOR — o tip yedi
              zorunlu açıklanabilirlik alanı ister (alternatifler, güven),
              iyileştirme kaydında bunların karşılığı yoktur ve boş
              geçmek uydurmak olurdu. */}
          <div className="flex flex-col gap-4">
            {opportunities.envelope?.data.map((o) => (
              <div key={o.id} className="odin-ai-region flex flex-col gap-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-content font-medium">{o.title}</span>
                  {/* Glyph KAPALI: badge'in ○ işareti bir DURUM göstergesidir,
                      öncelik seviyesi değil — ve metin ("high"/"medium")
                      seviyeyi zaten açıkça söylüyor. Renk semantiği de
                      verilmedi: ODIN önceliği ETİKET olarak yayınlıyor,
                      arayüz ona kendi ciddiyet skalasını giydiremez. */}
                  {o.priorityLevel ? (
                    <Badge variant="tertiary" showGlyph={false}>
                      {o.priorityLevel}
                    </Badge>
                  ) : null}
                </div>
                <Text size="sm" tone="secondary">
                  {o.summary}
                </Text>
                <Text size="sm">
                  <strong>Önerilen adım:</strong> {o.suggestedAction}
                </Text>
                {o.evidence.length > 0 ? (
                  <Text size="sm" tone="tertiary">
                    Kanıt: {o.evidence.join(" · ")}
                  </Text>
                ) : null}
                <Text size="sm" tone="tertiary">
                  {o.source} · {relativeTime(o.asOf, now)}
                </Text>
              </div>
            ))}
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
          {kpis.data?.data.map((k) => (
            <ExecutiveKPICard key={k.id} env={{ data: k, meta: kpis.data!.meta }} />
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
        <AIBrief env={isEmpty ? null : brief.data} />
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
          {directors.data?.data.map((d) => (
            <DirectorCard
              key={d.agentId}
              env={{ data: d, meta: directors.data!.meta }}
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
          <Timeline items={isEmpty ? [] : (timeline.data?.data ?? [])} />
          {timeline.data && !isEmpty && (
            <TrustSignal meta={timeline.data.meta} className="mt-3" />
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
          <AIPulse env={isEmpty ? null : pulse.data} />
        </Section>
      </div>
    </div>
  );
}
