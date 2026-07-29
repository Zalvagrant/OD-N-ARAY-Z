/**
 * Amazon Director mock verisi — UI-ADR-094.
 *
 * ⚠️ HEPSİ MOCK. Zarfların `meta.source` alanı istisnasız `"mock"`tur.
 *
 * ANTI-FAKE, MOCK'TA DA GEÇERLİ — bu dosyada üç somut örneği var:
 *  1. `netProfit: null` ve `profitAfterAds: null`. COGS Amazon'da yoktur ve
 *     girilmemiştir; net kâr UYDURULMAZ (UI-ADR-099). Yerine `grossProfit`
 *     ve neyin hariç tutulduğu gelir.
 *  2. `SkuHealth.grossMarginPerUnit` her SKU'da `null` — aynı sebep.
 *  3. Ölçülmeyen alanlar (bazı SKU'larda `healthScore`, `buyBoxRate`,
 *     `conversionRate`) `null` bırakıldı; "0" yazmak "ölçülmedi" demek
 *     değildir.
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
  Opportunity,
  PPCOverview,
  SimulationCase,
} from "@/types/executive";
import type { SkuHealth } from "@/types/screens";
import { ago, ahead, mockEnvelope } from "./envelope";

/* Ekranda TEK para birimi — UI-ADR-103. Reklam tutarları da TRY'dir:
   farklı birimdeki harcama ciroyla oranlanamaz ve TACOS anlamsızlaşır. */
const TRY = "TRY";

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
      excerpt: "CPC ₺31'den ₺38'e çıktı.",
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

function stockEvidence(): EvidenceRef[] {
  return [
    {
      id: "ev-velocity",
      type: "metric",
      title: "Satış hızı — SKU-1042",
      excerpt: "Günlük ortalama 63 adet; üç haftada %22 arttı.",
      sourceQuality: 90,
      freshness: ago(2 * 60 * 60_000),
      supportsOrContradicts: "supports",
    },
    {
      id: "ev-leadtime",
      type: "document",
      title: "Tedarik süresi tablosu",
      excerpt: "Deniz yolu 21 gün, hava kargo 6 gün.",
      sourceQuality: 78,
      freshness: ago(6 * 24 * 60 * 60_000),
      supportsOrContradicts: "supports",
    },
  ];
}

function bidRecommendation(): AIRecommendation {
  return {
    id: "rec-bid-curve",
    recommendation:
      "Kampanya B'de teklifleri %12 düşür, bütçeyi Kampanya D'ye kaydır.",
    numbers: { ACOS: 31.4, "Hedef ACOS": 18, "Harcama (₺)": 26_880, ROAS: 3.2 },
    causeAnalysis:
      "Kampanya B'de rakip teklifleri yükseldi; CPC arttı ama dönüşüm artmadı.",
    impactAnalysis:
      "Mevcut tempoda ayda ~₺31.000 reklam israfı; aynı bütçe D'de 1,8 kat dönüyor.",
    alternatives: [
      {
        title: "Teklifi %12 düşür, bütçeyi D'ye kaydır",
        description: "Kayıp kampanyayı kısıp kazananı besle.",
        expectedOutcome: "ACOS ~%24'e iner, toplam satış korunur.",
        risk: "low",
      },
      {
        title: "Kampanya B'yi tamamen durdur",
        description: "Bütçenin tamamı D ve A'ya gider.",
        expectedOutcome: "ACOS hızla düşer, marka görünürlüğü azalır.",
        risk: "medium",
      },
    ],
    expectedFinancialResult: { amount: 31_000, currency: TRY },
    confidence: 91,
    evidence: adsEvidence().slice(0, 3),
    whyGenerated: "Kampanya B'nin ACOS'u 14 gündür hedefin iki katında.",
    responsibleDirector: "Amazon AI",
    relatedKnowledge: ["PPC oynaklık politikası", "Kampanya bütçe hiyerarşisi"],
    lastValidated: ago(20 * 60_000),
    potentialRisks: [
      "Teklif düşüşü gösterim payını daha da azaltabilir",
      "Kayıt dışı sezonluk talep varsa ölçüm yanıltır",
    ],
  };
}

function scaleRecommendation(): AIRecommendation {
  return {
    id: "rec-scale-d",
    recommendation: "Kampanya D bütçesini %20 artır, 7 gün sonra ölç.",
    numbers: { ACOS: 11.2, ROAS: 8.9, "Bütçe tükenme saati": "14:20" },
    causeAnalysis:
      "Kampanya D bütçesini her gün öğleden sonra bitiriyor; talep karşılanmıyor.",
    impactAnalysis:
      "Kaçırılan gösterimler günde ~₺4.100 satış demek; ACOS hedefin çok altında.",
    alternatives: [
      {
        title: "Bütçeyi %20 artır",
        description: "Kademeli artış, 7 gün ölçüm.",
        expectedOutcome: "Gün boyu yayın; ACOS %13 civarına çıkar.",
        risk: "low",
      },
      {
        title: "Bütçeyi sabit tut, teklifi %8 artır",
        description: "Aynı bütçeyle daha iyi konum al.",
        expectedOutcome: "Satış artışı daha küçük, nakit etkisi yok.",
        risk: "low",
      },
    ],
    expectedFinancialResult: { amount: 118_000, currency: TRY },
    confidence: 87,
    evidence: adsEvidence().slice(0, 2),
    whyGenerated: "Bütçe 9 gündür gün bitmeden tükeniyor ve ACOS hedefin altında.",
    responsibleDirector: "Amazon AI",
    relatedKnowledge: ["Bütçe tükenme raporu", "2026-Q3 reklam planı"],
    lastValidated: ago(25 * 60_000),
    potentialRisks: ["Artan bütçe daha zayıf arama terimlerine kayabilir"],
  };
}

function stockRecommendation(): AIRecommendation {
  return {
    id: "rec-stock-1042",
    recommendation: "SKU-1042 için 600 adetlik acil sipariş aç.",
    numbers: { "Kalan gün": 9, "Tedarik süresi (gün)": 21, "Günlük satış": 63 },
    causeAnalysis: "Satış hızı üç haftada %22 arttı, sipariş planı güncellenmedi.",
    impactAnalysis: "Tükenme 12 gün stoksuz kalma demek; BuyBox ve sıralama kaybı.",
    alternatives: [
      {
        title: "600 adet acil sipariş",
        description: "Hava kargo, 6 gün.",
        expectedOutcome: "Stoksuz gün sayısı 0.",
        risk: "medium",
      },
      {
        title: "300 adet + fiyat artışı",
        description: "Talebi yavaşlatarak süreyi uzat.",
        expectedOutcome: "Stoksuz kalınmaz, satış adedi düşer.",
        risk: "low",
      },
    ],
    expectedFinancialResult: { amount: 128_000, currency: TRY },
    confidence: 88,
    evidence: stockEvidence(),
    whyGenerated: "Tahmini tükenme süresi tedarik süresinin altına indi.",
    responsibleDirector: "Amazon AI",
    relatedKnowledge: ["Tedarik süresi tablosu", "2026-Q2 stok politikası"],
    lastValidated: ago(40 * 60_000),
    potentialRisks: ["Hava kargo birim maliyeti %14 daha yüksek"],
  };
}

/* --------------------------------------------------------------------------
   Uyarılar ve fırsatlar — 09-...md §6 · §7 (yalnızca Amazon modülü)
   -------------------------------------------------------------------------- */

export function amazonAlertsMock(): DataEnvelope<Alert[]> {
  return mockEnvelope([
    {
      id: "am-al-buybox",
      severity: "critical",
      title: "BuyBox kaybı — 3 SKU",
      description: "Fiyat rekabeti nedeniyle üç SKU'da BuyBox kaybedildi.",
      module: "amazon",
      affectedEntities: ["SKU-1042", "SKU-1188", "SKU-2001"],
      suggestedMitigation: "Repricer eşiklerini gözden geçir.",
      responsibleDirector: "Amazon AI",
      requiresAction: true,
      createdAt: ago(12 * 60_000),
    },
    {
      id: "am-al-stock",
      severity: "risk",
      title: "Stok tükenme riski — SKU-1042",
      description: "Tahmini tükenme 9 gün. Tedarik süresi 21 gün.",
      module: "amazon",
      affectedEntities: ["SKU-1042"],
      suggestedMitigation: "600 adetlik acil sipariş aç.",
      responsibleDirector: "Amazon AI",
      requiresAction: true,
      createdAt: ago(3 * 60 * 60_000),
    },
    {
      id: "am-al-acos",
      severity: "risk",
      title: "ACOS yükselişi — Kampanya B",
      description: "ACOS %31,4'e çıktı; hedef %18.",
      module: "amazon",
      affectedEntities: ["camp-b"],
      suggestedMitigation: "Teklifleri %12 düşür, bütçeyi D'ye kaydır.",
      responsibleDirector: "Amazon AI",
      requiresAction: true,
      createdAt: ago(70 * 60_000),
    },
    {
      id: "am-al-listing",
      severity: "warning",
      title: "Listeleme hatası — SKU-3310",
      description: "Görsel çözünürlüğü Amazon eşiğinin altında; arama görünürlüğü düşük.",
      module: "amazon",
      affectedEntities: ["SKU-3310"],
      suggestedMitigation: "Ana görseli 1600 px üzerine çıkar.",
      responsibleDirector: "Amazon AI",
      requiresAction: true,
      createdAt: ago(26 * 60 * 60_000),
    },
    /* requiresAction:false → listeye GİRMEZ, elendiği altta yazılır. */
    {
      id: "am-al-sync",
      severity: "info",
      title: "SP-API senkronizasyonu tamamlandı",
      description: "Bilgi amaçlı — aksiyon gerektirmez.",
      module: "amazon",
      affectedEntities: [],
      responsibleDirector: "Amazon AI",
      requiresAction: false,
      createdAt: ago(18 * 60_000),
    },
  ] satisfies Alert[]);
}

export function amazonOpportunitiesMock(): DataEnvelope<Opportunity[]> {
  return mockEnvelope([
    {
      id: "am-opp-scale",
      title: "Kampanya D ölçeklenebilir — bütçe gün bitmeden tükeniyor",
      category: "advertising",
      revenueImpact: { amount: 118_000, currency: TRY },
      confidence: 87,
      deadline: ahead(9 * 24 * 60 * 60_000),
      recommendedAction: scaleRecommendation(),
      evidence: adsEvidence().slice(0, 2),
    },
    {
      id: "am-opp-keyword",
      title: "Yükselen arama terimi — 'katlanır kamp sandalyesi'",
      category: "keyword",
      revenueImpact: { amount: 64_000, currency: TRY },
      confidence: 83,
      deadline: ahead(7 * 24 * 60 * 60_000),
      recommendedAction: bidRecommendation(),
      evidence: adsEvidence(),
    },
    {
      id: "am-opp-pricing",
      title: "SKU-2988 fiyatı rakip bandının %8 altında",
      category: "pricing",
      revenueImpact: { amount: 27_500, currency: TRY },
      confidence: 76,
      deadline: ahead(14 * 24 * 60 * 60_000),
      recommendedAction: scaleRecommendation(),
      evidence: adsEvidence().slice(1, 3),
    },
    {
      id: "am-opp-bundle",
      title: "SKU-1188 + SKU-2001 paket satışı",
      category: "bundle",
      revenueImpact: { amount: 41_000, currency: TRY },
      confidence: 71,
      deadline: ahead(21 * 24 * 60 * 60_000),
      recommendedAction: stockRecommendation(),
      evidence: stockEvidence(),
    },
  ] satisfies Opportunity[]);
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
      revenue: { amount: 4_182_000, currency: TRY },

      /* NET KÂR HESAPLANAMIYOR — UI-ADR-099. Uydurulmaz. */
      netProfit: null,
      grossProfit: { amount: 2_640_000, currency: TRY },
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
      inventoryValue: { amount: 1_930_000, currency: TRY },
      topRisk: alerts.find((a) => a.severity === "critical") ?? null,
      topOpportunity: opportunities[0] ?? null,
      missionProgress: 62,

      intelligence: {
        numbers: {
          "Ciro (₺)": 4_182_000,
          "Gross Profit (₺)": 2_640_000,
          ACOS: 18.1,
          TACOS: 3.2,
          "BuyBox (%)": 91.6,
          Sipariş: 3_914,
        },
        analysis:
          "ACOS artışının tamamı Kampanya B'den geliyor: CPC ₺31'den ₺38'e çıktı, dönüşüm sabit kaldı. Diğer üç kampanya hedef bandında.",
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

   "Net Profit" kartı YOKTUR (UI-ADR-099): hesaplanamayan bir kâr rakamı
   yerine "Gross Profit (ücretler hariç)" gösterilir ve neyin hariç tutulduğu
   şeridin altında yazılır.
   -------------------------------------------------------------------------- */

function kpi(over: Partial<ExecutiveKPI> & Pick<ExecutiveKPI, "id" | "label">): ExecutiveKPI {
  return {
    value: Number.NaN,
    unit: "score",
    trend: { direction: "flat", changePercent: Number.NaN, comparedTo: "önceki ay" },
    sparkline: [],
    aiInsight: "",
    confidence: Number.NaN,
    forecast: { value: Number.NaN, horizon: "", confidence: Number.NaN },
    risk: "none",
    evidence: [],
    owner: "Amazon AI",
    ...over,
  };
}

export function amazonKpisMock(): DataEnvelope<ExecutiveKPI[]> {
  const bid = bidRecommendation();
  const stock = stockRecommendation();

  return mockEnvelope([
    kpi({
      id: "am-kpi-net-sales",
      label: "Net Sales",
      value: 4_182_000,
      unit: "currency",
      currency: TRY,
      trend: { direction: "up", changePercent: 8, comparedTo: "önceki ay" },
      sparkline: [3_410, 3_620, 3_580, 3_910, 4_040, 4_120, 4_182],
      aiInsight: "Büyüme adetten değil, ortalama sepet tutarından geliyor.",
      confidence: 92,
      forecast: { value: 4_400_000, horizon: "30 gün", confidence: 78 },
      risk: "low",
      evidence: adsEvidence().slice(0, 2),
    }),
    kpi({
      id: "am-kpi-gross-profit",
      label: "Gross Profit (ücretler hariç)",
      value: 2_640_000,
      unit: "currency",
      currency: TRY,
      trend: { direction: "down", changePercent: 4, comparedTo: "önceki ay" },
      sparkline: [2_810, 2_784, 2_742, 2_705, 2_688, 2_661, 2_640],
      aiInsight:
        "Bu NET KÂR DEĞİLDİR: Amazon ücretleri, COGS, iade ve nakliye düşülmemiştir. Net kâr COGS girilene kadar hesaplanamaz.",
      confidence: 84,
      forecast: { value: 2_580_000, horizon: "30 gün", confidence: 66 },
      risk: "medium",
      recommendedAction: bid,
      evidence: adsEvidence().slice(0, 3),
      owner: "Finance AI",
    }),
    kpi({
      id: "am-kpi-acos",
      label: "ACOS",
      value: 18.1,
      unit: "percent",
      scale: "0-100",
      trend: { direction: "up", changePercent: 21, comparedTo: "geçen hafta" },
      sparkline: [14.2, 14.8, 15.6, 16.4, 17.2, 17.8, 18.1],
      aiInsight: "Artışın tamamı Kampanya B'den; diğer üç kampanya hedef bandında.",
      confidence: 93,
      forecast: { value: 15.2, horizon: "14 gün", confidence: 71 },
      risk: "high",
      recommendedAction: bid,
      evidence: adsEvidence(),
    }),
    kpi({
      id: "am-kpi-tacos",
      label: "TACOS",
      /* 135.000 / 4.182.000 — PPC harcaması ile ciro arasındaki gerçek oran
         (UI-ADR-103). Eskiden 9,4 yazıyordu; o değer ekrandaki harcamayla
         160 kat uyumsuzdu. */
      value: 3.2,
      unit: "percent",
      scale: "0-100",
      trend: { direction: "up", changePercent: 12, comparedTo: "geçen hafta" },
      sparkline: [2.7, 2.8, 2.9, 3.0, 3.1, 3.1, 3.2],
      aiInsight: "Toplam ciroya göre reklam yükü artıyor; organik satış payı düşüyor.",
      confidence: 88,
      forecast: { value: 3.5, horizon: "14 gün", confidence: 64 },
      risk: "medium",
      evidence: adsEvidence().slice(0, 2),
    }),
    kpi({
      id: "am-kpi-roas",
      label: "ROAS",
      /* PPC kartıyla AYNI değer: 745.900 / 135.000 = 5,5 (UI-ADR-103).
         Şerit ile kart farklı ROAS söylerse ikisi de inandırıcılığını
         kaybeder. `amazon.test.ts` bu eşitliği koruyor. */
      value: 5.5,
      unit: "score",
      trend: { direction: "down", changePercent: 14, comparedTo: "geçen hafta" },
      sparkline: [7.1, 6.8, 6.4, 6.1, 5.9, 5.7, 5.5],
      aiInsight: "ACOS'un aynası; kampanya B düzeltilirse 6,5 bandına döner.",
      confidence: 90,
      forecast: { value: 6.5, horizon: "14 gün", confidence: 69 },
      risk: "medium",
      evidence: adsEvidence().slice(0, 2),
    }),
    kpi({
      id: "am-kpi-active-skus",
      label: "Active SKUs",
      value: 41,
      unit: "count",
      trend: { direction: "flat", changePercent: 0, comparedTo: "önceki ay" },
      sparkline: [41, 41, 42, 42, 41, 41, 41],
      aiInsight: "SKU-3310 listeleme hatası nedeniyle arama sonuçlarında zayıf.",
      confidence: 97,
      forecast: { value: 43, horizon: "30 gün", confidence: 52 },
      risk: "low",
      evidence: [],
    }),
    kpi({
      id: "am-kpi-inventory-value",
      label: "Inventory Value",
      value: 1_930_000,
      unit: "currency",
      currency: TRY,
      trend: { direction: "down", changePercent: 9, comparedTo: "önceki ay" },
      sparkline: [2_210, 2_160, 2_090, 2_040, 1_990, 1_954, 1_930],
      aiInsight: "Düşüş satıştan; yeniden sipariş açılmazsa 3 hafta içinde riskli.",
      confidence: 86,
      forecast: { value: 1_640_000, horizon: "30 gün", confidence: 73 },
      risk: "high",
      recommendedAction: stock,
      evidence: stockEvidence(),
    }),
    kpi({
      id: "am-kpi-buybox",
      label: "BuyBox Rate",
      value: 91.6,
      unit: "percent",
      scale: "0-100",
      trend: { direction: "down", changePercent: 3, comparedTo: "geçen hafta" },
      sparkline: [97.1, 96.4, 95.2, 94.1, 93.0, 92.2, 91.6],
      aiInsight: "Üç SKU'da kayıp var; ikisi fiyat, biri stok kaynaklı.",
      confidence: 85,
      forecast: { value: 94, horizon: "14 gün", confidence: 61 },
      risk: "high",
      evidence: [],
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
      spend: { amount: 135_000, currency: TRY },
      sales: { amount: 745_900, currency: TRY },
      acos: 18.1,
      roas: 5.5,
      /* Kâr metriği — COGS olmadan hesaplanamaz (UI-ADR-099). */
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
            alternatives: [scaleRecommendation().alternatives[0]!],
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

function sku(over: Partial<SkuHealth> & Pick<SkuHealth, "sku" | "asin" | "title">): SkuHealth {
  return {
    healthScore: null,
    status: "healthy",
    unitsAvailable: null,
    daysOfSupply: null,
    estimatedStockoutAt: null,
    reorderUnits: null,
    unitsSoldLast30d: null,
    revenueLast30d: null,
    conversionRate: null,
    buyBoxRate: null,
    adSpendLast30d: null,
    adSalesLast30d: null,
    acos: null,
    /* COGS yok → birim kâr HİÇBİR SKU'da hesaplanamaz (UI-ADR-099). */
    grossMarginPerUnit: null,
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
      status: "critical",
      unitsAvailable: 567,
      daysOfSupply: 9,
      estimatedStockoutAt: inDays(9),
      reorderUnits: 600,
      unitsSoldLast30d: 1_890,
      revenueLast30d: { amount: 1_134_000, currency: TRY },
      conversionRate: 11.4,
      buyBoxRate: 62.0,
      adSpendLast30d: { amount: 26_880, currency: TRY },
      adSalesLast30d: { amount: 85_680, currency: TRY },
      acos: 31.4,
      price: { amount: 599, currency: TRY },
    }),
    sku({
      sku: "SKU-1188",
      asin: "B0B9XN2PLT",
      title: "Kamp Masası — Alüminyum 60×40",
      healthScore: 64,
      status: "at_risk",
      unitsAvailable: 1_240,
      daysOfSupply: 31,
      estimatedStockoutAt: inDays(31),
      reorderUnits: 400,
      unitsSoldLast30d: 1_190,
      revenueLast30d: { amount: 654_500, currency: TRY },
      conversionRate: 8.9,
      buyBoxRate: 71.3,
      adSpendLast30d: { amount: 17_220, currency: TRY },
      adSalesLast30d: { amount: 120_540, currency: TRY },
      acos: 14.3,
      price: { amount: 549, currency: TRY },
    }),
    sku({
      sku: "SKU-2001",
      asin: "B0D1FF7KLM",
      title: "Termos 1L — Çift Cidarlı",
      healthScore: 72,
      status: "watch",
      unitsAvailable: 2_310,
      daysOfSupply: 58,
      estimatedStockoutAt: inDays(58),
      unitsSoldLast30d: 1_196,
      revenueLast30d: { amount: 418_600, currency: TRY },
      conversionRate: 12.7,
      buyBoxRate: 78.4,
      adSpendLast30d: { amount: 9_240, currency: TRY },
      adSalesLast30d: { amount: 83_160, currency: TRY },
      acos: 11.1,
      price: { amount: 350, currency: TRY },
    }),
    sku({
      sku: "SKU-2450",
      asin: "B0BQ4HG8ZR",
      title: "Uyku Tulumu — 3 Mevsim",
      healthScore: 88,
      status: "healthy",
      unitsAvailable: 890,
      daysOfSupply: 74,
      estimatedStockoutAt: inDays(74),
      unitsSoldLast30d: 361,
      revenueLast30d: { amount: 469_300, currency: TRY },
      conversionRate: 9.6,
      buyBoxRate: 98.2,
      adSpendLast30d: { amount: 7_560, currency: TRY },
      adSalesLast30d: { amount: 67_620, currency: TRY },
      acos: 11.2,
      price: { amount: 1_299, currency: TRY },
    }),
    sku({
      sku: "SKU-2988",
      asin: "B0CG7YT4NN",
      title: "Kamp Lambası — Şarjlı 500lm",
      healthScore: 91,
      status: "healthy",
      unitsAvailable: 3_120,
      daysOfSupply: 96,
      estimatedStockoutAt: inDays(96),
      unitsSoldLast30d: 975,
      revenueLast30d: { amount: 243_750, currency: TRY },
      conversionRate: 14.2,
      buyBoxRate: 99.1,
      adSpendLast30d: { amount: 4_032, currency: TRY },
      adSalesLast30d: { amount: 47_040, currency: TRY },
      acos: 8.6,
      price: { amount: 250, currency: TRY },
    }),
    sku({
      sku: "SKU-3310",
      asin: "B0DHH2MMQ4",
      title: "Kamp Ocağı — Katlanır Bek",
      /* Listeleme hatası var; sağlık skoru HESAPLANMADI. "0" yazmak
         "ölçülmedi" demek değildir — null kalır ve ekranda NoData çıkar. */
      status: "at_risk",
      unitsAvailable: 410,
      daysOfSupply: 120,
      unitsSoldLast30d: 102,
      revenueLast30d: { amount: 45_900, currency: TRY },
      conversionRate: 2.1,
      buyBoxRate: 88.0,
      price: { amount: 450, currency: TRY },
    }),
    sku({
      sku: "SKU-4102",
      asin: "B0F2ZK1WQP",
      title: "Portatif Duş — 12V",
      healthScore: 55,
      status: "watch",
      unitsAvailable: 128,
      daysOfSupply: 17,
      estimatedStockoutAt: inDays(17),
      reorderUnits: 250,
      unitsSoldLast30d: 226,
      revenueLast30d: { amount: 158_200, currency: TRY },
      conversionRate: 6.4,
      /* Yeni listelendi — BuyBox oranı henüz raporlanmadı (13-...md §4). */
      adSpendLast30d: { amount: 3_108, currency: TRY },
      adSalesLast30d: { amount: 16_380, currency: TRY },
      acos: 19.0,
      price: { amount: 700, currency: TRY },
    }),
    sku({
      sku: "SKU-5077",
      asin: "B0E8RRT3LV",
      title: "Şişme Mat — Çift Kişilik",
      healthScore: 79,
      status: "healthy",
      unitsAvailable: 640,
      daysOfSupply: 44,
      estimatedStockoutAt: inDays(44),
      unitsSoldLast30d: 436,
      revenueLast30d: { amount: 392_400, currency: TRY },
      conversionRate: 10.8,
      buyBoxRate: 96.5,
      adSpendLast30d: { amount: 5_460, currency: TRY },
      adSalesLast30d: { amount: 43_680, currency: TRY },
      acos: 12.5,
      price: { amount: 900, currency: TRY },
    }),
  ] satisfies SkuHealth[]);
}
