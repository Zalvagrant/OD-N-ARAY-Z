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
 *   · Net Profit          COGS yok → hesaplanamaz (UI-ADR-116)
 *   · Profit After Ads    aynı sebep
 *   · Sales & Profit seri sözleşmesi yok (13-...md §16.4)
 *   · Orders akışı        sözleşme yok (aynı yer)
 */

import { useState } from "react";
import type { AIRecommendation, AmazonSnapshot } from "@/types/executive";
import { remainingTime, useNow } from "@/lib/clock/tick";
import { useUiStore } from "@/lib/store/ui";
import { MockBadge } from "@/components/ui/mock-badge";
import {
  demoError,
  emptied,
  noContract,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import {
  useAmazonAlerts,
  useAmazonKpis,
  useAmazonPpc,
  useAmazonSkus,
} from "@/lib/data/odin-amazon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { NoData } from "@/components/ui/no-data";
import { Search } from "@/components/ui/search";
import { Mono, Num, Pct, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { AIBrief } from "@/components/executive/ai-brief";
import { AIRecommendationView } from "@/components/executive/ai-recommendation-card";
import { AlertStack } from "@/components/executive/alert-stack";
import { CampaignIntelligenceList } from "@/components/executive/campaign-intelligence";
import { DataGuard } from "@/components/executive/data-guard";
import { ExecutiveKPICard } from "@/components/executive/executive-kpi-card";
import { PPCOverviewCard } from "@/components/executive/ppc-overview";
import { SimulationPanel } from "@/components/executive/simulation-panel";
import { ThresholdNote } from "@/components/executive/threshold-note";
import {
  AMAZON_SKU_KIND,
  SKU_SCALE,
  SKU_STATUS,
} from "@/features/amazon/presentation/sku";
import {
  BUY_BOX_RISK_BELOW,
  BUY_BOX_RISK_DESCRIPTION,
  UI_THRESHOLD_PROVENANCE,
} from "@/features/amazon/presentation/thresholds";
import {
  atRiskSkus,
  losingBuyBoxSkus,
  unmeasuredSkus,
} from "@/features/amazon/selectors";
import { GlanceView } from "@/features/amazon/director/glance-view";
import type { SkuHealth } from "@/types/screens";
import { SKU_COLUMNS } from "@/features/amazon/director/sku-columns";
import { DecisionCenterLink } from "@/components/layout/decision-center-link";

/* --------------------------------------------------------------------------
/* --------------------------------------------------------------------------
   Ekran
   -------------------------------------------------------------------------- */

const DEMO_ERROR = demoError(
  "Amazon verisi yüklenemedi",
  "KPI'lar, SKU sağlığı ve PPC verisi güncel değil; bütçe kararı verilmemeli."
);



/**
 * RİSKLİ SKU SATIRI — `useNow` BURAYA İNDİ (UI-ADR-183, mimari denetim).
 *
 * ⚠️ NEDEN ÇIKARILDI: `useNow()` EKRANIN KÖKÜNDE çağrılıyordu ve arkasında
 * gerçek bir `setInterval(1000)` var (`lib/clock/tick.ts:18,28`). Kökteki
 * tek bir tick **tüm Amazon Director ağacını saniyede bir** yeniden
 * render ediyordu — ve bu ekran reponun en ağırı: 48 satırlık sanal
 * `DataTable`, 8 KPI kartı, PPC kartı, kampanya listesi, simülasyon
 * paneli, alarm yığını, AI brifingi. Repoda hiç `React.memo` yok
 * (tarandı) ve React Compiler kapalı; hiçbir çocuk korunmuyordu.
 *
 * Maliyetin tamamı **tek bir geri sayım etiketi** içindi. Üstelik
 * `sku-columns.tsx:26-28` bu alanın (`estimatedStockoutAt`) ODIN'de
 * ÜRETİLMEDİĞİNİ yazıyor (ADR-0149) — yani 1 Hz tick bugün büyük
 * olasılıkla daima `null` besliyordu.
 *
 * Çıktı birebir aynı; değişen tek şey render'ın YARIÇAPI.
 */
function AtRiskRow({ s }: { s: SkuHealth }) {
  const now = useNow();

  return (
    <li className="border-l-2 border-line pl-3">
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
  );
}

export function AmazonDirector({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const [query, setQuery] = useState("");
  /* Seçimde NESNE DEĞİL KİMLİK saklanır (UI-ADR-098 `SelectedEntity`):
     kopya, liste yenilendiğinde panelde bayat bir kayıt bırakırdı.
     Workspace'ten çıkınca seçim store'un kendi kuralıyla düşer. */
  const setSelectedEntity = useUiStore((st) => st.setSelectedEntity);
  const selectedSkuId = useUiStore((st) =>
    st.selectedEntity?.kind === AMAZON_SKU_KIND ? st.selectedEntity.id : null
  );

  /* CANLI — ODIN ADR-0147 `GET /api/amazon` (UI-ADR-126). Bu iki bölüm
     gerçek modda promote edilmiş SP-API ve Ads kayıtlarını gösterir;
     kalan altısının ODIN'de yayını hâlâ yok ve mock'ta kalıyor. */
  const kpis = useAmazonKpis();
  const alerts = useAmazonAlerts();

  /* ODIN KARŞILIĞI YOK (S10 · G3): AmazonSnapshot zorunlu alanlarının
     çoğu yayınlanmıyor (revenue · orders · tacos · buyBoxRate ·
     inventoryHealth · inventoryValue · intelligence). Yayında olanlar
     ZATEN KPI Strip ve SKU tablosunda canlı. */
  /* CANLI — ODIN ADR-0149 (UI-ADR-128). 48 SKU: kimlik, stok,
     gün-kapsamı, satılan adet, reklam, fiyat. Skor YOK ve
     türetilmiyor; durum kendi eşik provenance'ıyla geliyor. */
  const skus = useAmazonSkus();
  /* CANLI — ODIN `/api/amazon` reklam KPI'ları (ADR-0112/FR-0026):
     ad_spend · ad_sales · acos · roas · net_after_ads, hepsi
     `KO-ads-ads_report-*` kaynaklı. PPC sağlık skoru ODIN'de ÜRETİLMİYOR,
     kartta gerekçesiyle boş. Beş kalemden biri ölçülmemişse kart yarım
     çizilmez, hata döner. */
  const ppc = useAmazonPpc();
  /* FIXTURE KALDIRILDI — ODIN'de yayınlanmış kampanya kırılımı YOK.
     `/api/amazon` reklam KPI'larını TOPLAM olarak yayınlıyor; kampanya
     başına ayrıştırma bir kayıt olarak yok. Fixture, release modunda
     `enabled: IS_MOCK` yüzünden sorguyu hiç açmıyor ve bölüm BOŞ
     kalıyordu — mock modda dolu, üretimde boş bir bölüm, sahte veriden
     daha kötüdür: fark yalnız üretimde görülür.

     ODIN'de yayınlanmış simülasyon da YOK ve
     uydurulamaz. Motor var (`odin/scenario.py: apply_scenario`) ama
     saklanan sonuç yok: hangi senaryonun çalıştırılacağı (hangi kalem,
     yüzde kaç) SAHİP BEYANIDIR — eşiklerin beyan edilmesi gibi
     (ADR-0146). Delta'yı arayüzün seçmesi cevabı değil SORUYU
     uydurmak olurdu. `DataGuard` "Simülasyon verisi yok" basar;
     üretimde zaten bu görünüyordu, artık mock modda da aynısı. */
  const simulations = null;

  /* Canlı bölümün hatası SUSTURULMAZ (S8 dersi, main CLAUDE.md kural 6):
     bir bölüm gerçek uç noktadan besleniyorsa, o uç nokta düştüğünde
     ekranda beş adımlı açıklama görünmeli. Demo hatası önceliklidir —
     hata hâllerini göstermek onun tek işi. */
  const sectionError = (live: { toErrorState: () => SectionError } | null) =>
    demo === "error" ? DEMO_ERROR : (live?.toErrorState() ?? null);

  const { loading, error, isEmpty, reloadAll } = screenState({
    demo,
    primary: kpis,
    sources: [kpis, skus, ppc, alerts],
    error: DEMO_ERROR,
  });

  /**
   * ÖLÇÜLMEDİYSE "YOK" DENMEZ — UI-ADR-155 (bağımsız denetim bulgusu).
   *
   * Burada `?? []` vardı ve zarf `null` olduğunda (kaynak bağlı değil,
   * `/api/amazon` hata verdi ya da ilk yükleme sürüyor) liste boş diziye
   * düşüyordu. Ardından bölümler `atRisk.length === 0` diye bakıp şunları
   * yazıyordu:
   *     "Stok riski yok — Hiçbir SKU riskli ya da kritik durumda değil."
   *     "BuyBox kaybı yok — Oranı raporlanan SKU'ların hepsi %90 üzerinde."
   * Üçü de birer ÖLÇÜMDÜR ve hiçbiri ölçülmemiştir. Sahibin göreceği fark,
   * işin sağlıklı mı yoksa hiç izlenmiyor mu olduğudur — CLAUDE.md §2.
   *
   * `mission-control`de UI-ADR-120 ile bulunup düzeltilen hatanın AYNISI;
   * bu ekranda uygulanmamıştı. `null` = ölçülmedi, `[]` = ölçüldü ve boş.
   */
  /* Tablonun GERÇEKTEN gösterdiği satır sayısı — UI-ADR-156. Arama
     kutusu ham listeyi sayıyordu; filtre tablonun içinde uygulanıyor. */
  const [filteredSkuCount, setFilteredSkuCount] = useState<number | null>(null);
  const measuredSkus = isEmpty ? [] : (skus.envelope?.data ?? null);
  const skuRows = measuredSkus ?? [];
  /* Bastırılan sayı SÖYLENİR — UI-ADR-163. Hızı ölçülmemiş SKU'lar risk
     kohortuna girmez (doğru), ama boş kohort "hiçbiri riskli değil" diye
     yazıyordu; 48'in 29'u ölçülmemişken bu bir ÖLÇÜM iddiasıdır. */
  const olculemeyen = unmeasuredSkus(skuRows);
  /* FR-0046 v1 Opportunity'de `category` YOK — reklam/genel ayrımını sürecek
     bir kaynak alan kalmadı, ayrım UYDURULMAZ (UI-ADR-106). Tüm fırsatlar
     §1.6 Feed'de yaşar; PPC Katman 3 gerekçeli boş durum gösterir. Kategori/
     domain alanı sorusu 13-...md §17'de (FR-0042 fingerprint'i zaten
     (domain, recommendation_type, …) kullanıyor — alan gelirse ayrım döner). */
  const feedOpportunities: AIRecommendation[] = [];

  /* ODIN sözlüğü (UI-ADR-128). `unknown` BU LİSTEYE GİRMEZ: hızı
     ölçülemeyen bir SKU riskli değildir, ÖLÇÜLMEMİŞTİR — ikisini
     karıştırmak 48'in 29'unu risk listesine doldurur ve liste anlamını
     yitirir. `no_movement` da ayrı bir bulgudur, stok riski değil. */
  const atRisk = atRiskSkus(skuRows);
  const losingBuyBox = losingBuyBoxSkus(skuRows);

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="Amazon Director"
        context="Bugün Amazon işinde hangi kararları vermeliyim?"
        /* Snapshot HÂLÂ yayınlanmıyor; KPI şeridi ise ODIN'den CANLI geliyor.
           Yalnız snapshot'a bakan başlık, ekran gerçek sayılarla doluyken
           "senkron yok" diyordu. Önce gerçekten bağlı olan kaynağın zamanı
           yazılır; ikisi de yoksa `—` kalır ve bu dürüsttür. */
        lastSync={
          kpis.envelope?.meta.lastUpdated ?? null
        }
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
            resultCount={query ? filteredSkuCount : null}
          />
        }
      />

      {/* ---------- PRIMARY FOCUS AREA — Layer 1 ---------- */}
      {loading ? (
        <Section title="Executive Glance" loading loadingLayout="kpi" loadingCount={8} />
      ) : error ? (
        <Section title="Executive Glance" error={error} onRetry={reloadAll} />
      ) : (
        <DataGuard<AmazonSnapshot> env={null} reason="Amazon anlık görüntüsü üretilmedi">
          {(s, meta) => <GlanceView s={s} meta={meta} />}
        </DataGuard>
      )}

      <Section
        title="Executive KPI Strip"
        description="Kapalıyken sade, açıkken mini rapor. Ölçüm kaynağı olmayan metrik değer göstermez."
        loading={loading || kpis.loading}
        loadingLayout="kpi"
        loadingCount={8}
        error={sectionError(kpis.error)}
        onRetry={reloadAll}
        /* Boşluk diziden gelir — UI-ADR-163 (bkz. briefing/screen.tsx). */
        empty={isEmpty || (kpis.envelope?.data.length ?? 0) === 0}
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
        <Text size="sm" tone="tertiary" className="mt-3">
          Şeritte <strong>Net Profit yoktur</strong>: COGS Amazon&apos;da
          bulunmadığı ve girilmediği için net kâr hesaplanamıyor. Yerine
          &quot;Gross Profit (ücretler hariç)&quot; gösteriliyor; neyin hariç
          tutulduğu Executive Glance&apos;te listelenmiştir (UI-ADR-116).
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
            columns={SKU_COLUMNS}
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
            onFilteredCount={setFilteredSkuCount}
            emptyTitle={measuredSkus === null ? "SKU verisi ölçülmedi" : "SKU yok"}
            emptyDescription={
              measuredSkus === null
                ? "Kaynak bağlı değil ya da yanıt vermedi — bu, aktif SKU olmadığı anlamına GELMEZ."
                : "SP-API'den aktif SKU gelmedi."
            }
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
          empty={measuredSkus !== null && atRisk.length === 0}
          emptyTitle="Stok riski yok"
          emptyDescription={
            olculemeyen.length > 0
              ? `Değerlendirilen ${skuRows.length - olculemeyen.length} SKU'nun hiçbiri riskli değil — ${olculemeyen.length} SKU hızı ölçülmediği için DEĞERLENDİRİLEMEDİ.`
              : "Hiçbir SKU riskli ya da kritik durumda değil."
          }
        >
          <ul className="flex flex-col gap-3">
            {atRisk.map((s) => (
              <AtRiskRow key={s.sku} s={s} />
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
            "09-data-contracts.md sipariş seviyesinde bir sözleşme içermiyor; `AmazonSnapshot.orders` yalnızca bir SAYIDIR. Akış ve anomali listesi bu sayıdan türetilemez.",
            "13-backend-recommendations.md §16.4"
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
            "09-data-contracts.md hiçbir yerde etiketli zaman serisi tanımlamıyor; `ExecutiveKPI.sparkline` yalnızca YÖN gösterir, tarihli seri değildir. Eksen etiketlerini uydurmak, olmayan bir ölçümü varmış gibi göstermek olurdu.",
            "13-backend-recommendations.md §16.4"
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
          <PPCOverviewCard env={isEmpty ? null : ppc.envelope} />
        </Section>

        <Section
          title="Opportunity Feed"
          description="Ürün · fiyat · paket fırsatları. Risklerle eşit ağırlıkta."
          loading={loading}
          loadingLayout="card"
          loadingCount={2}
          error={error}
          onRetry={reloadAll}
          empty={feedOpportunities.length === 0}
          emptyTitle="Fırsat üretilmedi"
          emptyDescription="Bu dönem için ölçülmüş bir ürün/fiyat fırsatı yok."
        >
          {/* ADR-0143 §3: fırsat ayrı kayıt değil, öneri kaydının pozitif
              sınıfıdır → mevcut öneri görünümü kullanılır. */}
          <div className="flex flex-col gap-4">
            {feedOpportunities.map((r) => (
              <div key={r.id} className="odin-ai-region p-3">
                <AIRecommendationView rec={r} compact />
              </div>
            ))}
            <Text size="sm" tone="tertiary">
              Pozitif sınıfı işaretleyen alan ODIN&apos;de bildirilmediği için
              liste filtrelenmiyor (13-...md §17).
            </Text>
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
              null
            }
            title="Amazon Executive Intelligence"
          />
        </Section>

        <Section
          title="BuyBox"
          description={BUY_BOX_RISK_DESCRIPTION}
          loading={loading}
          loadingLayout="list"
          loadingCount={3}
          error={error}
          onRetry={reloadAll}
          empty={measuredSkus !== null && losingBuyBox.length === 0}
          emptyTitle="BuyBox kaybı yok"
          emptyDescription={`Oranı raporlanan SKU'ların hepsi %${BUY_BOX_RISK_BELOW} üzerinde.`}
          emptySuggestion="Oranı hiç raporlanmayan SKU'lar bu listeye giremez — kaynağı doğrulanmalı (13-...md §4)."
        >
          <ul className="flex flex-col gap-2">
            {losingBuyBox.map((s) => (
              <li
                key={s.sku}
                className="flex items-baseline justify-between gap-3 border-b border-line-subtle pb-2 last:border-b-0"
              >
                <Mono size="sm">{s.sku}</Mono>
                <Pct value={s.sales.buyBoxRate} scale={SKU_SCALE} size="sm" />
              </li>
            ))}
          </ul>
          {/* Eşik ODIN'den gelmiyor, arayüzde duruyor — bunu saklamak
              uydurulmuş bir OTORİTE sunmak olurdu (UI-ADR-126 deseni). */}
          <ThresholdNote provenance={UI_THRESHOLD_PROVENANCE} className="mt-3" />
        </Section>

        <Section
          title="Alerts"
          description="Yalnızca aksiyon gerektirenler listelenir."
          loading={loading || alerts.loading}
          loadingLayout="list"
          loadingCount={4}
          error={sectionError(alerts.error)}
          onRetry={reloadAll}
        >
          <AlertStack
            env={isEmpty ? emptied(alerts.envelope) : alerts.envelope}
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
          <CampaignIntelligenceList env={null} />

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

          <SimulationPanel env={simulations} />
        </div>
      </Section>

      <DecisionCenterLink prefix="Amazon kararlarının tamamı için" />
    </div>
  );
}
