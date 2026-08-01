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
import type { DataMeta } from "@/types/data-envelope";
import type { ExecutiveHero } from "@/types/screens";
import { relativeTime, useNow } from "@/lib/clock/tick";
import { MockBadge } from "@/components/ui/mock-badge";
import {
  demoError,
  emptied,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { greeting } from "@/features/executive/presentation/greeting";
import { useOdinFixture } from "@/lib/data/odin-fixture";
/* CANLI fırsat görünümü main'den (S16 / UI-ADR-141) — mock'a GERİ
   DÖNDÜRÜLMEDİ. `useMockData` ve `@/mocks/mock-badge` ise S13'ün tek veri
   borusuyla (UI-ADR-135) değiştirildi: main o borudan önceki hâldeydi. */
import {
  useOdinAlerts,
  useOdinDirectors,
  useOdinOpportunities,
  useOdinTimeline,
  type Opportunity,
} from "@/lib/data/odin-state";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Timeline } from "@/components/ui/timeline";
import { Caption, Heading, Num, Text } from "@/components/ui/typography";
import { Stat } from "@/components/ui/stat";
import { Section } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { AIBrief } from "@/components/executive/ai-brief";
import { AIPulse } from "@/components/executive/ai-pulse";
import { AlertStack } from "@/components/executive/alert-stack";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "@/components/executive/confidence-badge";
import { DataGuard } from "@/components/executive/data-guard";
import { DecisionQueue } from "@/components/executive/decision-queue";
import type { VerdictInput } from "@/components/executive/decision-card";
import { RuntimeDirectorGrid } from "@/components/executive/runtime-director-card";
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
        {/* Dördü de `Stat`tır (UI-ADR-136). Elle yazılmış `<dt>/<dd>`
            çiftleriydi; `Stat`ın kendisiyle aynı sınıf dizesini taşıyor
            ama onun hizalama kuralını (sayı SATIR İÇİ) kaybediyorlardı. */}
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
          <Stat
            label="Today's Mission"
            value={
              hero.todaysMission ? (
                <Text size="sm">{hero.todaysMission}</Text>
              ) : (
                <NoData reason="Günün hedefi belirlenmedi" />
              )
            }
          />
          <Stat
            label="Current Focus"
            value={
              hero.currentFocus ? (
                <Text size="sm">{hero.currentFocus}</Text>
              ) : (
                <NoData reason="Odak konusu belirlenmedi" />
              )
            }
          />
          <Stat
            label="System Status"
            value={
              <>
                <Num
                  value={hero.systemHealthScore}
                  size="lg"
                  noDataReason="Sistem sağlık skoru ölçülmedi"
                />
                <Caption>/ 100</Caption>
              </>
            }
          />
          <Stat
            label="AI Readiness"
            /* Sözleşmede karşılığı YOK — uydurulmaz (13-...md §14.1). */
            value={
              <Num
                value={hero.aiReadiness}
                size="lg"
                noDataReason="AI hazırlık göstergesi henüz üretilmiyor (13-backend-recommendations.md §14.1)"
              />
            }
          />
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

const DEMO_ERROR = demoError(
  "Brifing verisi yüklenemedi",
  "Kritik kararlar ve riskler güncel değil."
);


/**
 * FIRSAT SATIRI — `useNow` BURAYA İNDİ (UI-ADR-183, mimari denetim).
 *
 * ⚠️ NEDEN ÇIKARILDI: `useNow()` EKRANIN KÖKÜNDE çağrılıyordu ve arkasında
 * gerçek bir `setInterval(1000)` var (`lib/clock/tick.ts:18,28`). Kökteki
 * tek bir tick, **tüm `ExecutiveBriefing` ağacını saniyede bir** yeniden
 * render ediyordu: Hero · DecisionQueue · AlertStack · KPI kartları ·
 * RuntimeDirectorGrid · 40 kayıtlık Timeline · AIPulse.
 *
 * Ve maliyetin tamamı **tek bir zaman etiketi** içindi (aşağıdaki
 * `relativeTime`). Repoda hiç `React.memo` yok (tarandı) ve React
 * Compiler kapalı — yani hiçbir çocuk bu render'dan korunmuyordu.
 *
 * Bu dosya doğrusunu ZATEN yapıyordu: `HeroView` kendi `useNow()`'unu
 * ihtiyacı olan yerde çağırıyor. Burada aynı desen tekrarlandı; çıktı
 * birebir aynı, değişen tek şey render'ın YARIÇAPI.
 */
function OpportunityRow({ o }: { o: Opportunity }) {
  const now = useNow();

  return (
    <div className="odin-ai-region flex flex-col gap-2 p-3">
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
  );
}

export function ExecutiveBriefing({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const [verdicts, setVerdicts] = useState<Record<string, VerdictInput>>({});

  const hero = useOdinFixture("briefing.hero");
  const decisions = useOdinFixture("briefing.decisions");
  /* CANLI — ODIN ADR-0151 kanonik Alert zarfı (`/api/state.alerts`).
     Mission Control bunu zaten okuyordu; brifing mock'ta kalmıştı.
     BUGÜN LİSTE BOŞ ve bu DOĞRU cevaptır: ölçüldü, üst üste patlayan iş
     yok. `state.risks` AYRI bir şekildir (name/level/status) ve Alert'e
     çevrilmez — genel bir risk sinyalinden kanonik alarm üretmek, ODIN'in
     kurmadığı bir kaydı kurmak olurdu. */
  const risks = useOdinAlerts();
  /* CANLI — ODIN ADR-0154 (main'de UI-ADR-141, S16). Fırsat AYRI KAYIT
     DEĞİL: ODIN mevcut iyileştirme kayıtları üzerinde bir GÖRÜNÜM
     yayınlıyor. Filtre (`detected` + uygulanabilir adım) ve sıralama
     ODIN'de; arayüz ikisini de icat etmiyor.

     ⚠️ MERGE NOTU: S13 dalı bu yuvayı `useOdinFixture` yapıyordu çünkü
     dal, S16 inmeden ÖNCE açılmıştı. Naif bir merge canlı veriyi mock'a
     geri döndürür ve repo kuralı #2'yi ihlal ederdi. İskelet S13'ten,
     fırsat kaynağı main'den. */
  const opportunities = useOdinOpportunities();
  const kpis = useOdinFixture("briefing.kpis");
  const brief = useOdinFixture("briefing.brief");
  /* CANLI — ODIN ADR-0148 (`/api/state.directors`, 8 kayıt).
     `AgentHealth` mock'u BIRAKILDI: gecikme, başarı oranı, token, maliyet,
     kuyruk gibi alanları `AgentHealthMonitor.snapshot()` üretir ve ODIN onu
     `state.agents` altında **boş dizi** olarak yayınlıyor. Ölçülmeyen sekiz
     metriği çizmek yerine, gerçekten ölçülen heartbeat sağlığı gösteriliyor —
     hüküm (`status`) ODIN'de hesaplanır, arayüz eşik tutmaz (UI-ADR-111). */
  const directors = useOdinDirectors();
  /* CANLI — ODIN `/api/state.timeline` (40 kayıtlık pencere, sunucuda
     kesiliyor). `tone` ve `description` BOŞ: ODIN olay için ton
     yayınlamıyor ve arayüz onu türetmez (UI-ADR-111 eşik yasağı). */
  const timeline = useOdinTimeline();
  const pulse = useOdinFixture("briefing.pulse");

  const { loading, error, isEmpty, reloadAll } = screenState({
    demo,
    primary: hero,
    sources: [hero, decisions, risks, opportunities, kpis, brief, directors, timeline, pulse],
    error: DEMO_ERROR,
  });

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
          env={isEmpty ? emptied(decisions.envelope) : decisions.envelope}
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
            env={isEmpty ? emptied(risks.envelope) : risks.envelope}
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
              <OpportunityRow key={o.id} o={o} />
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
        /* BOŞLUK DİZİDEN GELİR — UI-ADR-163. `empty={isEmpty}` yalnız
           demo bayrağına bakıyordu: zarf `data: []` ile geldiğinde bayrak
           false kalıyor, `map` hiçbir şey basmıyor ve ekranda BAŞLIĞI olan
           ama içeriği de boş durumu da olmayan bir bölüm kalıyordu.
           Sessiz bir bölüm, cevap değildir. */
        empty={isEmpty || (kpis.envelope?.data.length ?? 0) === 0}
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
        empty={isEmpty || (directors.envelope?.data.length ?? 0) === 0}
        emptyTitle="Director verisi yok"
        emptyDescription="Heartbeat servisi bağlı değil."
      >
        <RuntimeDirectorGrid env={directors.envelope} />
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
