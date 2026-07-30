"use client";

/**
 * Amazon Director — 06-workspaces.md §1. REFERANS MODÜL.
 *
 * Temel soru: "Bugün Amazon işinde hangi kararları vermeliyim?"
 * Bu bir raporlama ekranı değildir.
 *
 * ÜÇ KATMANLI OKUMA (§1.3):
 *   Layer 1  Executive Glance      — 10–15 sn, GRAFİK KARMAŞASI YOK
 *   Layer 2  Executive Intelligence— AIBrief, 5 adımlı sabit format
 *   Layer 3  Deep Analysis         — talep üzerine: SKU seçilir, sağ panel açılır
 *
 * PRIMARY FOCUS AREA TEK: Executive Glance + KPI Strip (03-...md §5).
 * Aşağıdaki dokuz bölüm destekleyicidir; hiçbiri şeritten ağır değildir.
 *
 * VERİ: hepsi mock (`meta.source === "mock"`, UI-ADR-094). Gerçek veri S8.
 *
 * ANTI-FAKE — bu ekranda dört yer BİLEREK boştur:
 *   · Net Profit          COGS yok → hesaplanamaz (UI-ADR-099)
 *   · Profit After Ads    aynı sebep
 *   · Sales & Profit seri sözleşmesi yok (13-...md §16.4)
 *   · Orders akışı        sözleşme yok (aynı yer)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import type { AmazonSnapshot } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import type { SkuHealth } from "@/types/screens";
import { remainingTime, useNow } from "@/lib/clock/tick";
import { toPercentUnit } from "@/lib/format/percent";
import { useUiStore } from "@/lib/store/ui";
import { useOdinQuery } from "@/lib/data/use-odin-query";
import { alertSchema, executiveKpiSchema, opportunitySchema } from "@/lib/data/schemas";
import type { OdinError } from "@/lib/data/errors";
import {
  amazonAlertsMock,
  amazonKpisMock,
  amazonOpportunitiesMock,
  campaignsMock,
  ppcOverviewMock,
  simulationsMock,
  skusMock,
  snapshotMock,
} from "@/mocks/amazon";
import { MockBadge } from "@/mocks/mock-badge";
import { useMockData } from "@/mocks/use-mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { NoData } from "@/components/ui/no-data";
import { Search } from "@/components/ui/search";
import { Stat } from "@/components/ui/stat";
import { Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { AIBrief } from "@/components/executive/ai-brief";
import { AlertStack } from "@/components/executive/alert-stack";
import { CampaignIntelligenceList } from "@/components/executive/campaign-intelligence";
import { ConfidenceBadge } from "@/components/executive/confidence-badge";
import { DataGuard } from "@/components/executive/data-guard";
import { ExecutiveKPICard } from "@/components/executive/executive-kpi-card";
import { Meter } from "@/components/executive/meter";
import { OpportunityCard } from "@/components/executive/opportunity-card";
import { PPCOverviewCard, PROFIT_NEEDS_COGS } from "@/components/executive/ppc-overview";
import { SimulationPanel } from "@/components/executive/simulation-panel";
import { TrustSignal } from "@/components/executive/trust-signal";
import { AMAZON_SKU_KIND, SKU_STATUS } from "./amazon-sku-panel";

/* --------------------------------------------------------------------------
   Layer 1 — Executive Glance. §1.3: "Grafik karmaşası yok, sadece:"
   -------------------------------------------------------------------------- */

function GlanceView({ s, meta }: { s: AmazonSnapshot; meta: DataMeta }) {
  const scale = s.percentScale;

  return (
    <Card tone="ai">
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-ai-text">
            Executive Glance · 10–15 saniye
          </span>
          <ConfidenceBadge meta={meta} label="Anlık görüntü güveni" />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Stat
            label="Amazon Health"
            note="0–100"
            value={
              <>
                <Meter
                  value={s.healthScore}
                  label="Amazon sağlık skoru"
                  tone={s.healthScore >= 80 ? "success" : "warning"}
                  noDataReason="Sağlık skoru hesaplanmadı"
                />
                <Num value={s.healthScore} size="lg" noDataReason="Skor yok" />
              </>
            }
          />

          <Stat
            label="Revenue"
            value={
              <Num
                value={s.revenue?.amount ?? null}
                format="currency"
                currency={s.revenue?.currency}
                size="lg"
                noDataReason="Ciro gelmedi"
              />
            }
          />

          {/* NET KÂR: hesaplanamıyorsa GÖSTERİLMEZ — UI-ADR-099.
              Yerine gross profit + neyin hariç tutulduğu. */}
          {s.netProfit ? (
            <Stat
              label="Net Profit"
              value={
                <Num
                  value={s.netProfit.amount}
                  format="currency"
                  currency={s.netProfit.currency}
                  size="lg"
                />
              }
            />
          ) : (
            <Stat
              label="Gross Profit (ücretler hariç)"
              note="Net kâr DEĞİL — hariç tutulanlar aşağıda"
              value={
                <Num
                  value={s.grossProfit?.amount ?? null}
                  format="currency"
                  currency={s.grossProfit?.currency}
                  size="lg"
                  noDataReason={PROFIT_NEEDS_COGS}
                />
              }
            />
          )}

          <Stat
            label="Orders"
            value={<Num value={s.orders} size="lg" noDataReason="Sipariş sayısı gelmedi" />}
          />

          <Stat
            label="ACOS"
            value={
              <Num
                value={toPercentUnit(s.acos, scale)}
                format="percent"
                fractionDigits={1}
                size="lg"
                noDataReason="ACOS ölçeği bildirilmedi"
              />
            }
          />

          <Stat
            label="TACOS"
            value={
              <Num
                value={toPercentUnit(s.tacos, scale)}
                format="percent"
                fractionDigits={1}
                size="lg"
                noDataReason="TACOS ölçeği bildirilmedi"
              />
            }
          />

          <Stat
            label="Buy Box"
            value={
              <Num
                value={toPercentUnit(s.buyBoxRate, scale)}
                format="percent"
                fractionDigits={1}
                size="lg"
                noDataReason="BuyBox oranı gelmedi"
              />
            }
          />

          <Stat
            label="Inventory Health"
            value={
              <Num
                value={toPercentUnit(s.inventoryHealth, scale)}
                format="percent"
                fractionDigits={1}
                size="lg"
                noDataReason="Stok sağlığı hesaplanmadı"
              />
            }
          />
        </dl>

        {/* Net kârın neden yazılmadığı — 13-...md §4'ün somut karşılığı. */}
        {!s.netProfit && (
          <div className="rounded-sm border border-line-subtle p-3">
            <p className="text-xs uppercase tracking-wide text-content-tertiary">
              Net kâr neden yazılmıyor
            </p>
            <Text size="sm" tone="secondary" className="mt-1">
              Net kâr = satış − Amazon ücretleri − reklam − iade − COGS −
              nakliye. Aşağıdaki kalemler hesaba GİRMEDİĞİ için net kâr
              gösterilmiyor; yanlış bir kâr rakamı, eksik bir kâr rakamından
              tehlikelidir.
            </Text>
            <ul className="mt-2 flex flex-wrap gap-2">
              {(s.profitBasis?.excluded ?? []).map((x) => (
                <li key={x}>
                  <Badge variant="tertiary" size="xs">
                    {x}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Top Risk · Top Opportunity · Mission Progress */}
        <dl className="grid gap-4 border-t border-line-subtle pt-4 sm:grid-cols-3">
          <Stat
            label="Top Risk"
            value={
              s.topRisk ? (
                <span className="text-sm text-content">{s.topRisk.title}</span>
              ) : (
                <NoData reason="Açık kritik risk yok" />
              )
            }
          />
          <Stat
            label="Top Opportunity"
            value={
              s.topOpportunity ? (
                <span className="text-sm text-content">{s.topOpportunity.title}</span>
              ) : (
                <NoData reason="Ölçülmüş fırsat yok" />
              )
            }
          />
          {/* Mission → Goal (ODIN ADR-0132 · UI-ADR-107): kaynak goals.py
              `progress_pct`. Nötr 50 buraya sızmaz — ölçülmüyorsa null. */}
          <Stat
            label="Goal Progress"
            note="günün Amazon hedefi"
            value={
              <>
                <Meter
                  value={s.goalProgressPct}
                  label="Hedef ilerlemesi"
                  noDataReason="İlerleme ölçülmüyor"
                />
                <Num value={s.goalProgressPct} size="sm" noDataReason="Ölçülmedi" />
              </>
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
   SKU Health tablosu — sütunlar dar kolona sığacak kadar; gerisi sağ panelde
   -------------------------------------------------------------------------- */

const SKU_SCALE = "0-100" as const;

function skuColumns(now: number | null): ColumnDef<SkuHealth, unknown>[] {
  return [
    {
      id: "sku",
      accessorKey: "sku",
      header: "SKU",
      cell: (c) => <Mono size="sm">{c.getValue() as string}</Mono>,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Durum",
      cell: (c) => {
        const s = SKU_STATUS[c.getValue() as SkuHealth["status"]];
        return s ? (
          <Badge variant={s.variant} size="xs">
            {s.label}
          </Badge>
        ) : (
          <NoData reason="Durum bilinmiyor" />
        );
      },
    },
    {
      id: "healthScore",
      accessorKey: "healthScore",
      header: "Sağlık",
      meta: { numeric: true },
      cell: (c) => (
        <Num
          value={c.getValue() as number | null}
          size="sm"
          noDataReason="Sağlık skoru hesaplanmadı"
        />
      ),
    },
    {
      id: "stockout",
      accessorKey: "estimatedStockoutAt",
      header: "Tükenme",
      cell: (c) => {
        /* GELECEK tarih → remainingTime (S5 dersi). */
        const left = remainingTime(c.getValue() as string | null, now);
        return left ? (
          <span className="text-sm text-content-secondary">{left}</span>
        ) : (
          <NoData reason="Tükenme tarihi hesaplanmadı" />
        );
      },
    },
    {
      id: "buyBoxRate",
      /* Dönem artık alan adında değil veride: `sales.buyBoxRate`. */
      accessorFn: (r) => r.sales.buyBoxRate,
      header: "BuyBox",
      meta: { numeric: true },
      cell: (c) => (
        <Num
          value={toPercentUnit(c.getValue() as number | null, SKU_SCALE)}
          format="percent"
          fractionDigits={1}
          size="sm"
          noDataReason="BuyBox oranı raporlanmadı"
        />
      ),
    },
  ];
}

/* --------------------------------------------------------------------------
   Ekran
   -------------------------------------------------------------------------- */

const DEMO_ERROR: SectionError = {
  what: "Amazon verisi yüklenemedi",
  why: "ODIN yerel sunucusu (127.0.0.1) yanıt vermedi.",
  impact: "KPI'lar, SKU sağlığı ve PPC verisi güncel değil; bütçe kararı verilmemeli.",
  fix: "ODIN sunucusunu başlat, sonra yeniden dene.",
};

/**
 * Demo hatası ile GERÇEK veri katmanı hatasını birleştirir — S7.
 *
 * Sözleşme ihlali bağlanmazsa bölüm sessizce BOŞ kalır: kullanıcı verinin
 * reddedildiğini hiç öğrenmez ve "bugün fırsat yok" sanır. Doğrulama
 * katmanının bütün değeri, reddin GÖRÜNMESİNDEDİR.
 */
function sectionError(demo: SectionError | null, live: OdinError | null): SectionError | null {
  return demo ?? (live ? live.toErrorState() : null);
}

/** Sözleşmesi olmayan bölümlerin ortak metni — UI-ADR-096. */
function noContract(name: string, why: string) {
  return {
    emptyTitle: `${name} sözleşmesi tanımlı değil`,
    emptyDescription: why,
    emptySuggestion:
      "Soru 13-backend-recommendations.md §16.4'e düşüldü; sözleşme geldiğinde bölüm aynı yere oturur.",
  };
}

function empty<T>(env: DataEnvelope<T[]> | null): DataEnvelope<T[]> | null {
  return env ? { data: [], meta: env.meta } : null;
}

export function AmazonDirector({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: "loading" | "empty" | "error";
}) {
  const router = useRouter();
  const now = useNow();
  const [query, setQuery] = useState("");
  /* Seçimde NESNE DEĞİL KİMLİK saklanır (UI-ADR-098 `SelectedEntity`):
     kopya, liste yenilendiğinde panelde bayat bir kayıt bırakırdı.
     Workspace'ten çıkınca seçim store'un kendi kuralıyla düşer. */
  const setSelectedEntity = useUiStore((st) => st.setSelectedEntity);
  const selectedSkuId = useUiStore((st) =>
    st.selectedEntity?.kind === AMAZON_SKU_KIND ? st.selectedEntity.id : null
  );

  /*
   * S7 VERİ KATMANI — üç bölüm artık doğrulayan borudan geçiyor.
   *
   * Neden ÜÇÜ: `useOdinQuery` zorunlu olarak bir şema ister ve şema yalnız
   * KANONİK sözleşmeler için yazıldı (09b + FR-0046 v1). AmazonSnapshot ·
   * PPCOverview · CampaignIntelligence · SimulationCase · SkuHealth'in
   * ODIN'de doğrulanmış karşılığı henüz YOK; onlara şema yazmak, sözleşmesi
   * olmayan bir şeyi sözleşmeliymiş gibi göstermek olurdu (meclis 5/5,
   * UI-ADR-113). Sözleşmeleri kapanınca (13-...md §16.2/§16.4, FR-0044)
   * aynı üç satırla buraya taşınırlar — kalan beşi o güne kadar mock
   * kancasında ve `meta.source === "mock"` aramasında görünür kalır.
   */
  const kpis = useOdinQuery({
    key: ["amazon", "kpis"],
    module: "amazon",
    schema: z.array(executiveKpiSchema),
    load: async () => amazonKpisMock(),
  });
  const alerts = useOdinQuery({
    key: ["amazon", "alerts"],
    module: "amazon",
    schema: z.array(alertSchema),
    load: async () => amazonAlertsMock(),
  });
  const opportunities = useOdinQuery({
    key: ["amazon", "opportunities"],
    module: "amazon",
    schema: z.array(opportunitySchema),
    load: async () => amazonOpportunitiesMock(),
  });

  const snapshot = useMockData(snapshotMock);
  const skus = useMockData(skusMock);
  const ppc = useMockData(ppcOverviewMock);
  const campaigns = useMockData(campaignsMock);
  const simulations = useMockData(simulationsMock);

  const loading = demo === "loading" || snapshot.loading;
  const error = demo === "error" ? DEMO_ERROR : null;
  const isEmpty = demo === "empty";

  const reloadAll = () => {
    snapshot.reload();
    kpis.refetch();
    skus.reload();
    ppc.reload();
    campaigns.reload();
    simulations.reload();
    alerts.refetch();
    opportunities.refetch();
  };

  const skuRows = isEmpty ? [] : (skus.data?.data ?? []);
  /* FR-0046 v1 Opportunity'de `category` YOK — reklam/genel ayrımını sürecek
     bir kaynak alan kalmadı, ayrım UYDURULMAZ (UI-ADR-106). Tüm fırsatlar
     §1.6 Feed'de yaşar; PPC Katman 3 gerekçeli boş durum gösterir. Kategori/
     domain alanı sorusu 13-...md §17'de (FR-0042 fingerprint'i zaten
     (domain, recommendation_type, …) kullanıyor — alan gelirse ayrım döner). */
  const feedOpportunities = isEmpty ? [] : (opportunities.envelope?.data ?? []);

  const atRisk = skuRows.filter(
    (s) => s.status === "critical" || s.status === "at_risk"
  );
  const losingBuyBox = skuRows
    .filter((s) => s.sales.buyBoxRate !== null && s.sales.buyBoxRate < 90)
    .sort((a, b) => (a.sales.buyBoxRate ?? 0) - (b.sales.buyBoxRate ?? 0));

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="Amazon Director"
        context="Bugün Amazon işinde hangi kararları vermeliyim?"
        lastSync={snapshot.data?.meta.lastUpdated ?? null}
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
            label="SKU ara"
            placeholder="SKU, ASIN veya başlık"
            onSearch={setQuery}
            resultCount={query ? skuRows.length : null}
          />
        }
      />

      {/* ---------- PRIMARY FOCUS AREA — Layer 1 ---------- */}
      {loading ? (
        <Section title="Executive Glance" loading loadingLayout="kpi" loadingCount={8} />
      ) : error ? (
        <Section title="Executive Glance" error={error} onRetry={reloadAll} />
      ) : (
        <DataGuard env={isEmpty ? null : snapshot.data} reason="Amazon anlık görüntüsü üretilmedi">
          {(s, meta) => <GlanceView s={s} meta={meta} />}
        </DataGuard>
      )}

      <Section
        title="Executive KPI Strip"
        description="Kapalıyken sade, açıkken mini rapor. Ölçüm kaynağı olmayan metrik değer göstermez."
        loading={loading || kpis.loading}
        loadingLayout="kpi"
        loadingCount={8}
        error={sectionError(error, kpis.error)}
        onRetry={reloadAll}
        empty={isEmpty}
        emptyTitle="KPI üretilmedi"
        emptyDescription="Hiçbir metrik hesaplanamadı."
      >
        {/* Kolon genişliği kuralı: bir KPI kartı ~260px altına inemez —
            `text-3xl` para değeri sığmaz (768 ve 1280'de ölçüldü). Sekiz kart
            bu yüzden 4 kolona ancak 2xl'de dizilir. */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 [&>*]:min-w-0">
          {kpis.envelope?.data.map((k) => (
            <ExecutiveKPICard key={k.id} env={{ data: k, meta: kpis.envelope!.meta }} />
          ))}
        </div>
        {/* S7 · UI-ADR-115: yenileme arızası şeridin tamamını ilgilendirir,
            bu yüzden kart başına değil ŞERİT BAŞINA bir kez yazılır.
            YALNIZ arıza varken: her kartın altında zaten kaynak+yaş satırı
            var; onu dokuzuncu kez tekrarlamak bilgi değil gürültüdür
            (görsel incelemede yakalandı). */}
        {kpis.envelope && kpis.refreshError && (
          <TrustSignal
            meta={kpis.envelope.meta}
            refreshFailed={kpis.refreshError.what}
            className="mt-3"
          />
        )}
        <Text size="sm" tone="tertiary" className="mt-3">
          Şeritte <strong>Net Profit yoktur</strong>: COGS Amazon&apos;da
          bulunmadığı ve girilmediği için net kâr hesaplanamıyor. Yerine
          &quot;Gross Profit (ücretler hariç)&quot; gösteriliyor; neyin hariç
          tutulduğu Executive Glance&apos;te listelenmiştir (UI-ADR-099).
        </Text>
      </Section>

      {/* ---------- Üç kolonlu yerleşim — 06-...md §1.1 ----------

          Kolonlar BAĞIMSIZ dikey akışlardır, satır satır hizalanan bir grid
          DEĞİL. Gerekçe: tek bir grid'de satır yüksekliği en uzun karta göre
          belirlenir; AI Insights (Layer 2 brifingi) yanındaki iki bölümün
          altında ~400px boşluk bırakıyordu (1920'de görsel incelemede
          ölçüldü). §1.1'deki tablonun kolonları zaten anlamlı gruplardır:
            1) SKU · Envanter · Sipariş   — operasyon
            2) Satış/Kâr · PPC · Fırsat   — para
            3) AI · BuyBox · Uyarı        — sinyal
          Dar ekranda tek kolona inerken bu sıra korunur. */}
      <div className="grid items-start gap-8 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-8">
        <Section
          title="SKU Health"
          description="Satır seç → detay sağ panelde açılır, ekran değişmez."
          loading={loading}
          loadingLayout="list"
          loadingCount={6}
          error={error}
          onRetry={reloadAll}
        >
          <DataTable
            label="SKU sağlık tablosu"
            data={skuRows}
            columns={skuColumns(now)}
            globalFilter={query}
            density="compact"
            onSelect={(row) =>
              setSelectedEntity(
                row
                  ? { workspaceId: "amazon", kind: AMAZON_SKU_KIND, id: row.sku }
                  : null
              )
            }
            getRowId={(r) => r.sku}
            emptyTitle="SKU yok"
            emptyDescription="SP-API'den aktif SKU gelmedi."
          />
          {selectedSkuId && (
            <Text size="sm" tone="tertiary" className="mt-2">
              Seçili: {selectedSkuId} — detay sağ bağlam panelinde.
            </Text>
          )}
        </Section>

        <Section
          title="Inventory Intelligence"
          description="Kritik stok, tahmini tükenme ve yeniden sipariş önerisi."
          loading={loading}
          loadingLayout="list"
          loadingCount={4}
          error={error}
          onRetry={reloadAll}
          empty={atRisk.length === 0}
          emptyTitle="Stok riski yok"
          emptyDescription="Hiçbir SKU riskli ya da kritik durumda değil."
        >
          <ul className="flex flex-col gap-3">
            {atRisk.map((s) => (
              <li key={s.sku} className="border-l-2 border-line pl-3">
                <p className="flex flex-wrap items-center gap-2">
                  <Mono size="sm">{s.sku}</Mono>
                  <Badge variant={SKU_STATUS[s.status].variant} size="xs">
                    {SKU_STATUS[s.status].label}
                  </Badge>
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-content-secondary">
                  <span>
                    Stok <Num value={s.unitsAvailable} size="sm" noDataReason="bilinmiyor" />
                  </span>
                  <span>
                    Tükenme{" "}
                    {remainingTime(s.estimatedStockoutAt, now) ?? (
                      <NoData reason="Tükenme tarihi hesaplanmadı" />
                    )}
                  </span>
                  <span>
                    Sipariş{" "}
                    <Num
                      value={s.reorderUnits}
                      size="sm"
                      noDataReason="Sipariş önerisi üretilmedi"
                    />
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Sipariş akışı sözleşmesi YOK — uydurulmaz (UI-ADR-096). */}
        <Section
          title="Orders"
          description="Sipariş akışı ve anomaliler."
          empty
          {...noContract(
            "Order",
            "09-data-contracts.md sipariş seviyesinde bir sözleşme içermiyor; `AmazonSnapshot.orders` yalnızca bir SAYIDIR. Akış ve anomali listesi bu sayıdan türetilemez."
          )}
        />
        </div>

        {/* ---- Kolon 2 — para: satış/kâr · reklam · fırsat ---- */}
        <div className="flex min-w-0 flex-col gap-8">
        {/* Zaman serisi sözleşmesi YOK — uydurulmaz (UI-ADR-096). */}
        <Section
          title="Sales & Profit Analytics"
          description="Günlük / haftalık / aylık / yıllık analiz."
          empty
          {...noContract(
            "Zaman serisi",
            "09-data-contracts.md hiçbir yerde etiketli zaman serisi tanımlamıyor; `ExecutiveKPI.sparkline` yalnızca YÖN gösterir, tarihli seri değildir. Eksen etiketlerini uydurmak, olmayan bir ölçümü varmış gibi göstermek olurdu."
          )}
        />

        {/* PPC Intelligence Center · Katman 1 */}
        <Section
          title="PPC Performance"
          description="Katman 1 — detaylı analiz aşağıda, PPC Intelligence Center'da."
          loading={loading}
          loadingLayout="kpi"
          loadingCount={6}
          error={error}
          onRetry={reloadAll}
        >
          <PPCOverviewCard env={isEmpty ? null : ppc.data} />
        </Section>

        <Section
          title="Opportunity Feed"
          description="Ürün · fiyat · paket fırsatları. Risklerle eşit ağırlıkta."
          loading={loading || opportunities.loading}
          loadingLayout="card"
          loadingCount={2}
          error={sectionError(error, opportunities.error)}
          onRetry={reloadAll}
          empty={feedOpportunities.length === 0}
          emptyTitle="Fırsat üretilmedi"
          emptyDescription="Bu dönem için ölçülmüş bir ürün/fiyat fırsatı yok."
        >
          <div className="flex flex-col gap-4">
            {feedOpportunities.map((o) => (
              <OpportunityCard
                key={o.id}
                env={{ data: o, meta: opportunities.envelope!.meta }}
              />
            ))}
          </div>
        </Section>
        </div>

        {/* ---- Kolon 3 — sinyal: AI yorumu · BuyBox · uyarılar ---- */}
        <div className="flex min-w-0 flex-col gap-8">
        {/* Layer 2 — Executive Intelligence */}
        <Section
          title="AI Insights"
          description="Önce sayı, sonra yorum: Evidence Before Opinion."
          loading={loading}
          loadingLayout="card"
          loadingCount={5}
          error={error}
          onRetry={reloadAll}
        >
          <AIBrief
            env={
              isEmpty || !snapshot.data
                ? null
                : { data: snapshot.data.data.intelligence, meta: snapshot.data.meta }
            }
            title="Amazon Executive Intelligence"
          />
        </Section>

        <Section
          title="BuyBox"
          description="BuyBox oranı %90'ın altına inen SKU'lar."
          loading={loading}
          loadingLayout="list"
          loadingCount={3}
          error={error}
          onRetry={reloadAll}
          empty={losingBuyBox.length === 0}
          emptyTitle="BuyBox kaybı yok"
          emptyDescription="Oranı raporlanan SKU'ların hepsi %90 üzerinde."
          emptySuggestion="Oranı hiç raporlanmayan SKU'lar bu listeye giremez — kaynağı doğrulanmalı (13-...md §4)."
        >
          <ul className="flex flex-col gap-2">
            {losingBuyBox.map((s) => (
              <li
                key={s.sku}
                className="flex items-baseline justify-between gap-3 border-b border-line-subtle pb-2 last:border-b-0"
              >
                <Mono size="sm">{s.sku}</Mono>
                <Num
                  value={toPercentUnit(s.sales.buyBoxRate, SKU_SCALE)}
                  format="percent"
                  fractionDigits={1}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="Alerts"
          description="Yalnızca aksiyon gerektirenler listelenir."
          loading={loading || alerts.loading}
          loadingLayout="list"
          loadingCount={4}
          error={sectionError(error, alerts.error)}
          onRetry={reloadAll}
        >
          <AlertStack
            env={isEmpty ? empty(alerts.envelope) : alerts.envelope}
            title="Aksiyon gerektirenler"
          />
        </Section>
        </div>
      </div>

      {/* ---------- PPC Intelligence Center — 06-...md §1.5 K2 · K3 · K4 ---------- */}
      <Section
        title="PPC Intelligence Center"
        description="Katman 2 kampanya analizi · Katman 3 kazanç fırsatları · Katman 4 simülatör. Katman 1 yukarıdaki PPC Performance kartıdır."
        loading={loading}
        loadingLayout="card"
        loadingCount={3}
        error={error}
        onRetry={reloadAll}
      >
        <div className="grid gap-8 xl:grid-cols-3 [&>*]:min-w-0">
          <CampaignIntelligenceList env={isEmpty ? empty(campaigns.data) : campaigns.data} />

          <div className="flex flex-col gap-4">
            <Text size="sm" tone="secondary">
              Katman 3 — Opportunity Center: yalnızca sorunlar değil, kazanç
              fırsatları da.
            </Text>
            {/* Fırsatlar Feed'de (§1.6). FR-0046 v1 Opportunity'de reklam/genel
                ayrımını sürecek alan yok; burada alt küme UYDURULMAZ. */}
            <Text size="sm" tone="tertiary">
              Fırsat sözleşmesinde (FR-0046 v1) reklam fırsatını genelden
              ayıracak bir alan yok; tüm fırsatlar Opportunity Feed&apos;de
              listeleniyor. Ayrım alanı ODIN&apos;e soruldu —
              13-backend-recommendations.md §17.
            </Text>
          </div>

          <SimulationPanel env={isEmpty ? empty(simulations.data) : simulations.data} />
        </div>
      </Section>

      <Text size="sm" tone="tertiary">
        Amazon kararlarının tamamı için{" "}
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
