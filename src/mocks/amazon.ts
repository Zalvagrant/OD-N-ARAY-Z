/**
 * Amazon Director mock verisi — UI-ADR-094.
 *
 * ⚠️ HEPSİ MOCK. Zarfların `meta.source` alanı istisnasız `"mock"`tur.
 *
 * ANTI-FAKE, MOCK'TA DA GEÇERLİ — bu dosyada üç somut örneği var:
 *  1. `netProfit: null` ve `profitAfterAds: null`. COGS Amazon'da yoktur ve
 *     girilmemiştir; net kâr UYDURULMAZ (UI-ADR-116). Yerine `grossProfit`
 *     ve neyin hariç tutulduğu gelir.
 *  2. Ölçülmeyen alanlar (bazı SKU'larda `healthScore`, `buyBoxRate`,
 *     `conversionRate`, `inventoryAsOf`) `null` bırakıldı; "0" yazmak
 *     "ölçülmedi" demek değildir.
 *  3. `SkuHealth.grossMarginPerUnit` alanı KALDIRILDI (UI-ADR-104): kalıcı
 *     olarak null kalacak bir alan, sözleşmede sahte bir yetenektir.
 *
 * Yüzde alanlarında ölçek BİLDİRİLİR (`percentScale: "0-100"`, UI-ADR-093);
 * bildirilmeseydi kartlar bilerek boş görünürdü.
 *
 * Değerler üretici fonksiyon içindedir: `Date.now()` modül yüklenirken değil,
 * istemcide çağrıldığında okunur (hydration güvenliği).
 */

import type { DataEnvelope } from "@/types/data-envelope";
import type {
  AIRecommendation,
  Alert,
  AmazonSnapshot,
  CampaignIntelligence,
  EvidenceRef,
  ExecutiveKPI,
  PPCOverview,
  SimulationCase,
} from "@/types/executive";
import type { MetricPeriod, ScoreFactor, SkuHealth } from "@/types/screens";
import { ago, ahead, mockEnvelope } from "./envelope";

/* Ekranda TEK para birimi — UI-ADR-103, sahip kararıyla USD.
   Gerekçe: Amazon US marketplace'inde satış, ücret ve reklam USD'dir;
   TRY'ye çevirmek her raporu değişken bir kura bağlar ve dünkü ekranla
   bugünküyü karşılaştırılamaz kılar. Kur riski Trading tarafının konusudur,
   Amazon operasyonunun değil. */
const USD = "USD";

/**
 * "n gün sonra" — yarım gün payla.
 *
 * `remainingTime` AŞAĞI yuvarlar: tam 9 gün sonrası, bir an geçtiği için
 * "8 gün kaldı" olur ve ekranda `daysOfSupply: 9` ile yan yana çelişir
 * (S6 görsel incelemesinde sağ panelde yakalandı). Pay bırakmak mock verisini
 * gerçekçi kılar; `remainingTime`'ın davranışı DEĞİŞTİRİLMEDİ — termin için
 * aşağı yuvarlamak doğrudur, erken uyarır.
 */
const inDays = (n: number) => ahead(n * 24 * 60 * 60_000 + 12 * 60 * 60_000);

/* --------------------------------------------------------------------------
   Kanıt ve öneriler — açıklanabilirliğin 7 alanı eksiksiz (09-...md §3)
   -------------------------------------------------------------------------- */

function adsEvidence(): EvidenceRef[] {
  return [
    {
      id: "ev-acos-14d",
      type: "metric",
      title: "ACOS son 14 gün",
      excerpt: "ACOS %18,1'e yükseldi; harcama sabit, satış düştü.",
      sourceQuality: 92,
      freshness: ago(30 * 60_000),
      supportsOrContradicts: "supports",
    },
    {
      id: "ev-impression-share",
      type: "metric",
      title: "Gösterim payı",
      excerpt: "Gösterim payı %31'den %24'e indi.",
      sourceQuality: 88,
      freshness: ago(45 * 60_000),
      supportsOrContradicts: "supports",
    },
    {
      id: "ev-cpc",
      type: "metric",
      title: "Ortalama CPC",
      excerpt: "CPC $0,74'ten $0,91'e çıktı.",
      sourceQuality: 86,
      freshness: ago(50 * 60_000),
      supportsOrContradicts: "supports",
    },
    {
      id: "ev-fx",
      type: "external",
      title: "USD/TRY 72 saatlik görünüm",
      excerpt: "Kur yukarı yönlü; ithalat maliyeti artabilir.",
      sourceQuality: 64,
      freshness: ago(3 * 60 * 60_000),
      supportsOrContradicts: "contradicts",
    },
  ];
}


function bidRecommendation(): AIRecommendation {
  return {
    id: "rec-bid-curve",
    recommendation:
      "Kampanya B'de teklifleri %12 düşür, bütçeyi Kampanya D'ye kaydır.",
    confidence: 78.5,
    confidenceBreakdown: {
      knowledge_coverage: 85,
      evidence_strength: 80,
      expert_agreement: 88,
      model_agreement: 75,
      historical_success: 70,
      risk_level: 35,
      missing_information: 25,
      decision_complexity: 30,
    },
    evidence: adsEvidence().slice(0, 3),
    potentialRisks: [
      "Teklif düşüşü gösterim payını daha da azaltabilir",
      "Kayıt dışı sezonluk talep varsa ölçüm yanıltır",
    ],
    assumptions: [
      "Rakip teklif bandı mevcut seviyesinde kalır",
      "Kampanya D aynı dönüşüm oranını sürdürür",
    ],
    flipConditions: [
      "Kampanya B'nin ACOS'u 7 günde %20 altına inerse teklif geri alınır",
      "Kampanya D'nin ACOS'u %15'i aşarsa aktarım durdurulur",
    ],
    consensusScore: 75.0,
    disagreementScore: 25.0,
    minorityOpinions: ["trading: beklet — kur riski nedeniyle 48 saat beklenmeli"],
    recClass: "B",
    numbers: { ACOS: 31.4, "Hedef ACOS": 18, "Harcama ($)": 640, ROAS: 3.2 },
    causeAnalysis:
      "Kampanya B'de rakip teklifleri yükseldi; CPC arttı ama dönüşüm artmadı.",
    impactAnalysis:
      "Mevcut tempoda ayda ~$740 reklam israfı; aynı bütçe D'de 1,8 kat dönüyor.",
    expectedFinancialResult: { amount: 740, currency: USD },
    whyGenerated: "Kampanya B'nin ACOS'u 14 gündür hedefin iki katında.",
    responsibleDirector: "Amazon AI",
    lastValidated: ago(20 * 60_000),
  };
}

function scaleRecommendation(): AIRecommendation {
  return {
    id: "rec-scale-d",
    recommendation:
      "Kampanya D bütçesini %20 artır, 7 gün sonra ölç.",
    confidence: 82.0,
    confidenceBreakdown: {
      knowledge_coverage: 85,
      evidence_strength: 80,
      expert_agreement: 88,
      model_agreement: 75,
      historical_success: 70,
      risk_level: 35,
      missing_information: 25,
      decision_complexity: 30,
    },
    evidence: adsEvidence().slice(0, 2),
    potentialRisks: [
      "Artan bütçe daha zayıf arama terimlerine kayabilir",
    ],
    assumptions: [
      "Talep mevcut seviyesinde kalır",
      "Stok kısıtı yok — SKU-1042 tükenirse varsayım düşer",
    ],
    flipConditions: [
      "ACOS %15'i aşarsa artış geri alınır",
      "Bütçe gün sonuna kadar tükenmemeye başlarsa artış durdurulur",
    ],
    consensusScore: 83.3,
    disagreementScore: 16.7,
    minorityOpinions: ["finance: beklet — nakit tamponu 30 güne çıkana kadar"],
    recClass: "B",
    numbers: { ACOS: 11.2, ROAS: 8.9, "Bütçe tükenme saati": "14:20" },
    causeAnalysis:
      "Kampanya D bütçesini her gün öğleden sonra bitiriyor; talep karşılanmıyor.",
    impactAnalysis:
      "Kaçırılan gösterimler günde ~$98 satış demek; ACOS hedefin çok altında.",
    expectedFinancialResult: { amount: 2_810, currency: USD },
    whyGenerated: "Bütçe 9 gündür gün bitmeden tükeniyor ve ACOS hedefin altında.",
    responsibleDirector: "Amazon AI",
    lastValidated: ago(25 * 60_000),
  };
}


/* --------------------------------------------------------------------------
   Uyarılar ve fırsatlar — 09-...md §6 · §7 (yalnızca Amazon modülü)
   -------------------------------------------------------------------------- */

/* ADR-0143 §1 kanonik Alert zarfı — zarfta olmayan alan mock'ta da yok. */
export function amazonAlertsMock(): DataEnvelope<Alert[]> {
  return mockEnvelope([
    {
      id: "AL-buybox-3sku",
      severity: "critical",
      title: "BuyBox kaybı — 3 SKU",
      module: "amazon",
      requiresAction: true,
      evidence: ["KO-amazon-buybox-2026-07-30"],
      createdAt: ago(12 * 60_000),
      suggestedAction: "Repricer eşiklerini gözden geçir.",
    },
    {
      id: "AL-stockout-sku-1042",
      severity: "risk",
      title: "Stok tükenme riski — SKU-1042",
      module: "amazon",
      requiresAction: true,
      evidence: ["KO-amazon-inventory-2026-07-30"],
      createdAt: ago(3 * 60 * 60_000),
      suggestedAction: "600 adetlik acil sipariş aç.",
    },
    {
      id: "AL-acos-camp-b",
      severity: "risk",
      title: "ACOS yükselişi — Kampanya B",
      module: "amazon",
      requiresAction: true,
      evidence: ["KO-ads-ads_report-2026-07-30"],
      createdAt: ago(70 * 60_000),
      suggestedAction: "Teklifleri %12 düşür, bütçeyi D'ye kaydır.",
    },
    {
      id: "AL-listing-sku-3310",
      severity: "warning",
      title: "Listeleme hatası — SKU-3310",
      module: "amazon",
      requiresAction: true,
      evidence: ["KO-amazon-asin-catalog-2026H1-0001"],
      createdAt: ago(26 * 60 * 60_000),
    },
    /* requiresAction:false → listeye GİRMEZ, elendiği altta yazılır. */
    {
      id: "AL-spapi-sync-done",
      severity: "info",
      title: "SP-API senkronizasyonu tamamlandı",
      module: "amazon",
      requiresAction: false,
      evidence: [],
      createdAt: ago(18 * 60_000),
    },
  ] satisfies Alert[]);
}

/*
 * ADR-0143 §3: fırsat AYRI KAYIT DEĞİL — öneri kaydının pozitif sınıfı.
 * Mock da bu yüzden `AIRecommendation` döndürür. Pozitif sınıfı işaretleyen
 * alan ODIN'de bildirilmedi (13-...md §17) → filtre uygulanmaz.
 */
export function amazonOpportunitiesMock(): DataEnvelope<AIRecommendation[]> {
  return mockEnvelope([scaleRecommendation(), bidRecommendation()]);
}

/* --------------------------------------------------------------------------
   §8 AmazonSnapshot — Layer 1 Executive Glance + Layer 2 Intelligence
   -------------------------------------------------------------------------- */

export function snapshotMock(): DataEnvelope<AmazonSnapshot> {
  const alerts = amazonAlertsMock().data;
  const opportunities = amazonOpportunitiesMock().data;

  return mockEnvelope(
    {
      percentScale: "0-100",
      healthScore: 78,
      revenue: { amount: 99_600, currency: USD },

      /* NET KÂR HESAPLANAMIYOR — UI-ADR-116. Uydurulmaz. */
      netProfit: null,
      grossProfit: { amount: 62_860, currency: USD },
      profitBasis: {
        excluded: [
          "COGS (Amazon'da yok, kullanıcı girmeli)",
          "Amazon ücretleri (referral · FBA · depolama)",
          "İade maliyeti",
          "Nakliye ve gümrük",
        ],
      },

      orders: 3_914,
      acos: 18.1,
      /* 135.000 / 4.182.000 = %3,2 — bkz. UI-ADR-103. */
      tacos: 3.2,
      buyBoxRate: 91.6,
      inventoryHealth: 63.4,
      activeSKUs: 41,
      inventoryValue: { amount: 45_950, currency: USD },
      topRisk: alerts.find((a) => a.severity === "critical") ?? null,
      topOpportunity: opportunities[0] ?? null,


      intelligence: {
        numbers: {
          /* Glance ile AYNI sayılar. Brifingin "📊 Numbers" adımı kartların
             tekrarıdır; farklı bir sayı yazarsa ekran kendi kendisiyle
             çelişir. `amazon.test.ts` bu eşitliği koruyor. */
          "Ciro ($)": 99_600,
          "Gross Profit ($)": 62_860,
          ACOS: 18.1,
          TACOS: 3.2,
          "BuyBox (%)": 91.6,
          Sipariş: 3_914,
        },
        analysis:
          "ACOS artışının tamamı Kampanya B'den geliyor: CPC $0,74'ten $0,91'e çıktı, dönüşüm sabit kaldı. Diğer üç kampanya hedef bandında.",
        interpretation:
          "Sorun bütçe değil, tek bir kampanyanın teklif seviyesidir. Bütçe D'ye kaydırılırsa toplam satış korunurken ACOS ~%15'e iner. Asıl kısıt reklam değil, SKU-1042 stoğudur: 9 gün sonra tükenirse reklam harcaması boşa gider.",
        recommendation: bidRecommendation(),
        evidence: adsEvidence(),
      },
    } satisfies AmazonSnapshot,
    { confidence: 89 }
  );
}

/* --------------------------------------------------------------------------
   Executive KPI Strip — 06-workspaces.md §1.2 (sekiz kalem, aynı sırada)

   FR-0046 v1 (UI-ADR-106): değerler {status, value, reason} zarfındadır.
   Trend · sparkline · AI yorumu · forecast · risk · öneri BİLEREK YOK:
   ODIN retained time series tutmadığı için bu alanların kaynağı yoktur
   (R-006 FR-0043) ve ANTI-FAKE MOCK'TA DA GEÇERLİDİR — kart onları NoData
   ile söyler. Boş yorum paneli dürüsttür; üretilmişi, kuralın önlediği
   hatanın ta kendisidir.

   "Net Profit" kartı YOKTUR (UI-ADR-116): hesaplanamayan bir kâr rakamı
   yerine "Gross Profit (ücretler hariç)" gösterilir ve neyin hariç tutulduğu
   şeridin altında yazılır.
   -------------------------------------------------------------------------- */

/* ADR-0143 §2: sınır zarfı DÜZ. Sparkline/forecast/insight sözleşme dışı,
   bu yüzden mock'ta da yok. */
function kpi(
  over: Partial<ExecutiveKPI> & Pick<ExecutiveKPI, "id" | "label" | "unit">
): ExecutiveKPI {
  return { status: "available", value: null, asOf: ago(30 * 60_000), ...over };
}

export function amazonKpisMock(): DataEnvelope<ExecutiveKPI[]> {
  return mockEnvelope([
    kpi({
      id: "net_sales",
      label: "Net Sales",
      value: 99_600,
      unit: "currency",
      currency: USD,
    }),
    kpi({
      id: "gross_profit",
      label: "Gross Profit (ücretler hariç)",
      value: 62_860,
      unit: "currency",
      currency: USD,
    }),
    kpi({
      id: "acos",
      label: "ACOS",
      value: 18.1,
      unit: "percent",
      scale: "0-100",
    }),
    kpi({
      id: "tacos",
      /* 135.000 / 4.182.000 — PPC harcaması ile ciro arasındaki gerçek oran
         (UI-ADR-103). Eskiden 9,4 yazıyordu; o değer ekrandaki harcamayla
         160 kat uyumsuzdu. */
      label: "TACOS",
      value: 3.2,
      unit: "percent",
      scale: "0-100",
    }),
    kpi({
      id: "roas",
      /* PPC kartıyla AYNI değer: 745.900 / 135.000 = 5,5 (UI-ADR-103).
         Şerit ile kart farklı ROAS söylerse ikisi de inandırıcılığını
         kaybeder. `amazon.test.ts` bu eşitliği koruyor. */
      label: "ROAS",
      value: 5.5,
      unit: "score",
    }),
    kpi({
      id: "active_skus",
      label: "Active SKUs",
      value: 41,
      unit: "count",
    }),
    kpi({
      id: "inventory_value",
      label: "Inventory Value",
      value: 45_950,
      unit: "currency",
      currency: USD,
    }),
    kpi({
      id: "buybox_rate",
      label: "BuyBox Rate",
      value: 91.6,
      unit: "percent",
      scale: "0-100",
    }),
  ]);
}

/* --------------------------------------------------------------------------
   §9 PPCData — K1 · K2 · K4
   -------------------------------------------------------------------------- */

export function ppcOverviewMock(): DataEnvelope<PPCOverview> {
  return mockEnvelope(
    {
      percentScale: "0-100",
      health: 71,
      /* UI-ADR-103 — dört sayı birbirini DOĞRULAR:
           ACOS  = 135.000 / 745.900 = %18,1
           ROAS  = 745.900 / 135.000 = 5,5
           TACOS = 135.000 / 4.182.000 = %3,2  (snapshot ile aynı)
         Önceki değerler (2.420 / 18.300 / 18,1 / 5,4) `06-...md` §1.5'teki
         örnek tablodan birebir kopyalanmıştı ve o örnek kendi içinde
         tutarsız: 2.420/18.300 = %13,2, oran ise 7,6. */
      spend: { amount: 3_187, currency: USD },
      sales: { amount: 17_608, currency: USD },
      acos: 18.1,
      roas: 5.5,
      /* Kâr metriği — COGS olmadan hesaplanamaz (UI-ADR-116). */
      profitAfterAds: null,
    } satisfies PPCOverview,
    { confidence: 88 }
  );
}

export function campaignsMock(): DataEnvelope<CampaignIntelligence[]> {
  return mockEnvelope(
    [
      {
        campaignId: "camp-a",
        name: "SP · Marka Savunma",
        status: "healthy",
        aiSummary: "ACOS %9,2, hedefin altında. Müdahale gerekmiyor.",
        suggestedActions: [],
      },
      {
        campaignId: "camp-b",
        name: "SP · Geniş Eşleşme — Kamp Serisi",
        status: "acos_rising",
        aiSummary:
          "ACOS 14 günde %14,2'den %31,4'e çıktı. CPC arttı, dönüşüm sabit; teklif seviyesi sorunu.",
        suggestedActions: [bidRecommendation()],
      },
      {
        campaignId: "camp-c",
        name: "SB · Video — Yeni Ürün",
        status: "budget_exhausting",
        aiSummary: "Günlük bütçe ortalama 16:40'ta bitiyor; akşam trafiği kaçıyor.",
        /* Tek alternatifli öneri — UI-ADR-091 gereği GÖSTERİLMEZ, kaç tanesinin
           elendiği satırın altında yazılır. Kural mock'ta da çalışır. */
        suggestedActions: [
          {
            ...scaleRecommendation(),
            id: "rec-camp-c-partial",
          },
        ],
      },
      {
        campaignId: "camp-d",
        name: "SP · Otomatik — Uzun Kuyruk",
        status: "scalable",
        aiSummary:
          "ACOS %11,2 ve bütçe 9 gündür gün bitmeden tükeniyor. Ölçeklenmeye hazır.",
        suggestedActions: [scaleRecommendation()],
      },
      {
        campaignId: "camp-e",
        name: "SD · Yeniden Hedefleme",
        status: "underperforming",
        aiSummary:
          "30 günde 412 tıklama, 3 satış. Dönüşüm %0,7; hesap ortalaması %4,1.",
        suggestedActions: [bidRecommendation()],
      },
    ] satisfies CampaignIntelligence[],
    { confidence: 86 }
  );
}

export function simulationsMock(): DataEnvelope<SimulationCase[]> {
  const assumptions = [
    "Elastikiyet katsayıları son 90 günün kampanya verisinden türetildi",
    "Rakip teklifleri ve CPC bandı sabit varsayıldı",
    "Stok kısıtı YOK varsayıldı — SKU-1042 tükenirse sonuçlar geçersizdir",
    "Kur sabit varsayıldı (USD/TRY)",
  ];

  return mockEnvelope(
    [
      {
        request: { parameter: "ppc_budget", changePercent: 15 },
        result: {
          scenarios: [
            { metric: "Satış", expectedChange: "+%9" },
            { metric: "Reklam harcaması", expectedChange: "+%15" },
            { metric: "Gross Profit", expectedChange: "+%4" },
            { metric: "ACOS", expectedChange: "+0,8 puan" },
          ],
          confidence: 89,
          assumptions,
        },
      },
      {
        request: { parameter: "ppc_budget", changePercent: -10 },
        result: {
          scenarios: [
            { metric: "Satış", expectedChange: "−%6" },
            { metric: "Reklam harcaması", expectedChange: "−%10" },
            { metric: "Gross Profit", expectedChange: "+%1" },
            { metric: "ACOS", expectedChange: "−0,5 puan" },
          ],
          confidence: 74,
          assumptions,
        },
      },
      /* Varsayımı bildirilmeyen senaryo GÖSTERİLMEZ (09-...md §9 zorunlu alan).
         Kural mock'ta da denenir; elendiği ekranda yazılır. */
      {
        request: { parameter: "ppc_budget", changePercent: 40 },
        result: {
          scenarios: [{ metric: "Satış", expectedChange: "+%19" }],
          confidence: 41,
          assumptions: [],
        },
      },
    ] satisfies SimulationCase[],
    { confidence: 82 }
  );
}

/* --------------------------------------------------------------------------
   SkuHealth — 🟡 TEKLİF sözleşme (UI-ADR-101). Ölçülmeyen alan `null`.
   -------------------------------------------------------------------------- */

/**
 * Sağlık skoru → durum eşikleri. **BACKEND POLİTİKASIDIR**, arayüz bunu
 * render için ASLA kullanmaz; mock burada backend'in yerine geçtiği için
 * duruyor ve `amazon.test.ts` mock'un kendi politikasına uyduğunu doğrular.
 *
 * Eşikler olmadan `status` ile `healthScore` sessizce çelişiyordu: SKU-4102
 * skoru 55 iken "İzlemede", SKU-1188 skoru 64 iken "Riskli" idi — daha kötü
 * skorlu SKU daha iyi etiketliydi (S6 kapanışında yakalandı, UI-ADR-104).
 */
/* ODIN'in sözlüğü (UI-ADR-128). Bantlar MOCK'a özgüdür: gerçek ODIN
   durumu bir SKORDAN değil, days_of_cover kural setinden gelir ve skor
   hiç yayınlanmaz (ADR-0149). Bu fixture sözleşmenin `statusBasis:
   "health_score"` dalını canlı tutuyor — o dalın bir üreticisi çıkarsa
   ekran hazır olsun diye. */
export const SKU_STATUS_BANDS = [
  { min: 80, status: "ok" as const },
  { min: 65, status: "warn" as const },
  { min: 45, status: "warn" as const },
  { min: 0, status: "critical" as const },
];

export function statusForScore(score: number): SkuHealth["status"] {
  return (
    SKU_STATUS_BANDS.find((b) => score >= b.min) ?? SKU_STATUS_BANDS[SKU_STATUS_BANDS.length - 1]!
  ).status;
}

/** Son 30 günlük ölçüm penceresi — dönem artık alan adında değil, veride. */
function last30(): MetricPeriod {
  const to = new Date();
  const from = new Date(to.getTime() - 29 * 24 * 60 * 60_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

/** Skor gerekçesi kısayolu: kod · mesaj · puan katkısı. */
const f = (code: string, message: string, contribution: number | null): ScoreFactor => ({
  code,
  message,
  contribution,
  direction:
    contribution === null ? "neutral" : contribution >= 0 ? "positive" : "negative",
});

function sku(
  over: Partial<SkuHealth> & Pick<SkuHealth, "sku" | "asin" | "title">
): SkuHealth {
  return {
    healthScore: null,
    healthScoreExplanation: null,
    status: "ok",
    statusBasis: "health_score",
    inventoryAsOf: ago(4 * 60 * 60_000),
    unitsAvailable: null,
    daysOfSupply: null,
    estimatedStockoutAt: null,
    reorderUnits: null,
    sales: {
      period: last30(),
      unitsSold: null,
      revenue: null,
      conversionRate: null,
      buyBoxRate: null,
    },
    advertising: { period: last30(), spend: null, sales: null, acos: null },
    price: null,
    ...over,
  };
}

export function skusMock(): DataEnvelope<SkuHealth[]> {
  return mockEnvelope([
    sku({
      sku: "SKU-1042",
      asin: "B0C4KJ9QW1",
      title: "Katlanır Kamp Sandalyesi — Antrasit",
      healthScore: 38,
      /* Katkılar 100'den skora GÖTÜRÜR: 100 − 28 − 22 − 12 = 38.
         Toplamayan bir gerekçe, gerekçe değildir; test bunu doğruluyor. */
      healthScoreExplanation: [
        f("LOW_DAYS_OF_SUPPLY", "Tahmini tükenme 9 gün; tedarik süresi 21 gün.", -28),
        f("BUYBOX_LOST", "BuyBox payı %62,0 — üç rakip fiyat kırdı.", -22),
        f("ACOS_ABOVE_TARGET", "ACOS %31,4, hedefin iki katı.", -12),
      ],
      status: "critical",
      unitsAvailable: 567,
      daysOfSupply: 9,
      estimatedStockoutAt: inDays(9),
      reorderUnits: 600,
      sales: {
        period: last30(),
        unitsSold: 1_890,
        revenue: { amount: 27_000, currency: USD },
        conversionRate: 11.4,
        buyBoxRate: 62.0,
      },
      advertising: {
        period: last30(),
        spend: { amount: 640, currency: USD },
        sales: { amount: 2_040, currency: USD },
        acos: 31.4,
      },
      price: { amount: 14.26, currency: USD },
    }),
    sku({
      sku: "SKU-1188",
      asin: "B0B9XN2PLT",
      title: "Kamp Masası — Alüminyum 60×40",
      healthScore: 64,
      healthScoreExplanation: [
        f("BUYBOX_PRESSURE", "BuyBox payı %71,3 — fiyat rekabeti sürüyor.", -20),
        f("LOW_CONVERSION", "Dönüşüm %8,9, kategori ortalamasının altında.", -16),
      ],
      status: "warn",
      unitsAvailable: 1_240,
      daysOfSupply: 31,
      estimatedStockoutAt: inDays(31),
      reorderUnits: 400,
      sales: {
        period: last30(),
        unitsSold: 1_190,
        revenue: { amount: 15_580, currency: USD },
        conversionRate: 8.9,
        buyBoxRate: 71.3,
      },
      advertising: {
        period: last30(),
        spend: { amount: 410, currency: USD },
        sales: { amount: 2_870, currency: USD },
        acos: 14.3,
      },
      price: { amount: 13.07, currency: USD },
    }),
    sku({
      sku: "SKU-2001",
      asin: "B0D1FF7KLM",
      title: "Termos 1L — Çift Cidarlı",
      healthScore: 72,
      healthScoreExplanation: [
        f("BUYBOX_PRESSURE", "BuyBox payı %78,4 — ara ara kaybediliyor.", -16),
        f("VELOCITY_SLOWING", "Satış hızı üç haftada %9 yavaşladı.", -12),
      ],
      status: "warn",
      unitsAvailable: 2_310,
      daysOfSupply: 58,
      estimatedStockoutAt: inDays(58),
      sales: {
        period: last30(),
        unitsSold: 1_196,
        revenue: { amount: 9_970, currency: USD },
        conversionRate: 12.7,
        buyBoxRate: 78.4,
      },
      advertising: {
        period: last30(),
        spend: { amount: 220, currency: USD },
        sales: { amount: 1_980, currency: USD },
        acos: 11.1,
      },
      price: { amount: 8.33, currency: USD },
    }),
    sku({
      sku: "SKU-2450",
      asin: "B0BQ4HG8ZR",
      title: "Uyku Tulumu — 3 Mevsim",
      healthScore: 88,
      healthScoreExplanation: [
        f("BUYBOX_STRONG", "BuyBox payı %98,2 — rekabet baskısı yok.", 6),
        f("LOW_CONVERSION", "Dönüşüm %9,6, kategori ortalamasının altında.", -18),
      ],
      status: "ok",
      unitsAvailable: 890,
      daysOfSupply: 74,
      estimatedStockoutAt: inDays(74),
      sales: {
        period: last30(),
        unitsSold: 361,
        revenue: { amount: 11_170, currency: USD },
        conversionRate: 9.6,
        buyBoxRate: 98.2,
      },
      advertising: {
        period: last30(),
        spend: { amount: 180, currency: USD },
        sales: { amount: 1_610, currency: USD },
        acos: 11.2,
      },
      price: { amount: 30.93, currency: USD },
    }),
    sku({
      sku: "SKU-2988",
      asin: "B0CG7YT4NN",
      title: "Kamp Lambası — Şarjlı 500lm",
      healthScore: 91,
      healthScoreExplanation: [
        f("HIGH_CONVERSION", "Dönüşüm %14,2 — kategori ortalamasının üstünde.", 5),
        f("OVERSTOCK", "96 günlük envanter; sermaye bağlıyor.", -14),
      ],
      status: "ok",
      unitsAvailable: 3_120,
      daysOfSupply: 96,
      estimatedStockoutAt: inDays(96),
      sales: {
        period: last30(),
        unitsSold: 975,
        revenue: { amount: 5_800, currency: USD },
        conversionRate: 14.2,
        buyBoxRate: 99.1,
      },
      advertising: {
        period: last30(),
        spend: { amount: 96, currency: USD },
        sales: { amount: 1_120, currency: USD },
        acos: 8.6,
      },
      price: { amount: 5.95, currency: USD },
    }),
    sku({
      sku: "SKU-3310",
      asin: "B0DHH2MMQ4",
      title: "Kamp Ocağı — Katlanır Bek",
      /* Skor HESAPLANMADI. Gerekçe yine de gelir: NEDEN hesaplanamadığı da
         bir açıklamadır. "0" yazmak "ölçülmedi" demek değildir. */
      healthScore: null,
      healthScoreExplanation: [
        f("AD_DATA_MISSING", "Ads API bu SKU için veri döndürmedi.", null),
        f("LISTING_ERROR", "Listeleme hatası nedeniyle ölçüm penceresi eksik.", null),
      ],
      /* Durum skordan DEĞİL, kuraldan geliyor — skor zaten yok. */
      status: "warn",
      statusBasis: "rule_set",
      /* Envanter anlık görüntüsü de gelmedi: tazelik bilinmiyor, uydurulmaz. */
      inventoryAsOf: null,
      unitsAvailable: 410,
      daysOfSupply: 120,
      sales: {
        period: last30(),
        unitsSold: 102,
        revenue: { amount: 1_090, currency: USD },
        conversionRate: 2.1,
        buyBoxRate: 88.0,
      },
      price: { amount: 10.71, currency: USD },
    }),
    sku({
      sku: "SKU-4102",
      asin: "B0F2ZK1WQP",
      title: "Portatif Duş — 12V",
      healthScore: 55,
      healthScoreExplanation: [
        f("LOW_CONVERSION", "Dönüşüm %6,4 — kategorinin en düşüğü.", -25),
        f("LOW_DAYS_OF_SUPPLY", "Tahmini tükenme 17 gün.", -12),
        f("ACOS_ABOVE_TARGET", "ACOS %19,0, hedefin bir puan üstünde.", -8),
      ],
      /* Eskiden "watch" idi ve 64 puanlı SKU-1188 "at_risk"ti — daha kötü
         skorlu SKU daha iyi etiketliydi. Eşik tablosuna uyduruldu. */
      status: "warn",
      unitsAvailable: 128,
      daysOfSupply: 17,
      estimatedStockoutAt: inDays(17),
      reorderUnits: 250,
      sales: {
        period: last30(),
        unitsSold: 226,
        revenue: { amount: 3_770, currency: USD },
        conversionRate: 6.4,
        buyBoxRate: null,
      },
      advertising: {
        period: last30(),
        spend: { amount: 74, currency: USD },
        sales: { amount: 390, currency: USD },
        acos: 19.0,
      },
      price: { amount: 16.67, currency: USD },
    }),
    sku({
      sku: "SKU-5077",
      asin: "B0E8RRT3LV",
      title: "Şişme Mat — Çift Kişilik",
      healthScore: 79,
      healthScoreExplanation: [
        f("BUYBOX_STRONG", "BuyBox payı %96,5 — stabil.", 4),
        f("LOW_CONVERSION", "Dönüşüm %10,8, ortalamanın hafif altında.", -17),
        f("REORDER_WINDOW", "44 günlük stok; sipariş penceresi yaklaşıyor.", -8),
      ],
      /* 79 puan `healthy` eşiğinin (80) bir puan altında — eskiden "healthy"
         yazıyordu. Eşik tablosu bunu da düzeltti. */
      status: "warn",
      unitsAvailable: 640,
      daysOfSupply: 44,
      estimatedStockoutAt: inDays(44),
      sales: {
        period: last30(),
        unitsSold: 436,
        revenue: { amount: 9_340, currency: USD },
        conversionRate: 10.8,
        buyBoxRate: 96.5,
      },
      advertising: {
        period: last30(),
        spend: { amount: 130, currency: USD },
        sales: { amount: 1_040, currency: USD },
        acos: 12.5,
      },
      price: { amount: 21.43, currency: USD },
    }),
  ] satisfies SkuHealth[]);
}
