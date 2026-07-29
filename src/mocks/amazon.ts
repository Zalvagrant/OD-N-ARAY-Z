/**
 * Amazon Director mock verisi — UI-ADR-094.
 *
 * ⚠️ HEPSİ MOCK. Zarfların `meta.source` alanı istisnasız `"mock"`tur.
 *
 * ANTI-FAKE, MOCK'TA DA GEÇERLİ — bu dosyada üç somut örneği var:
 *  1. `netProfit: null` ve `profitAfterAds: null`. COGS Amazon'da yoktur ve
 *     girilmemiştir; net kâr UYDURULMAZ (UI-ADR-099). Yerine `grossProfit`
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
  Opportunity,
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
    numbers: { ACOS: 31.4, "Hedef ACOS": 18, "Harcama ($)": 640, ROAS: 3.2 },
    causeAnalysis:
      "Kampanya B'de rakip teklifleri yükseldi; CPC arttı ama dönüşüm artmadı.",
    impactAnalysis:
      "Mevcut tempoda ayda ~$740 reklam israfı; aynı bütçe D'de 1,8 kat dönüyor.",
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
    expectedFinancialResult: { amount: 740, currency: USD },
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
      "Kaçırılan gösterimler günde ~$98 satış demek; ACOS hedefin çok altında.",
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
    expectedFinancialResult: { amount: 2_810, currency: USD },
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
    expectedFinancialResult: { amount: 3_050, currency: USD },
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
      revenueImpact: { amount: 2_810, currency: USD },
      confidence: 87,
      deadline: ahead(9 * 24 * 60 * 60_000),
      recommendedAction: scaleRecommendation(),
      evidence: adsEvidence().slice(0, 2),
    },
    {
      id: "am-opp-keyword",
      title: "Yükselen arama terimi — 'katlanır kamp sandalyesi'",
      category: "keyword",
      revenueImpact: { amount: 1_520, currency: USD },
      confidence: 83,
      deadline: ahead(7 * 24 * 60 * 60_000),
      recommendedAction: bidRecommendation(),
      evidence: adsEvidence(),
    },
    {
      id: "am-opp-pricing",
      title: "SKU-2988 fiyatı rakip bandının %8 altında",
      category: "pricing",
      revenueImpact: { amount: 655, currency: USD },
      confidence: 76,
      deadline: ahead(14 * 24 * 60 * 60_000),
      recommendedAction: scaleRecommendation(),
      evidence: adsEvidence().slice(1, 3),
    },
    {
      id: "am-opp-bundle",
      title: "SKU-1188 + SKU-2001 paket satışı",
      category: "bundle",
      revenueImpact: { amount: 975, currency: USD },
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
      revenue: { amount: 99_600, currency: USD },

      /* NET KÂR HESAPLANAMIYOR — UI-ADR-099. Uydurulmaz. */
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
      missionProgress: 62,

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
      value: 99_600,
      unit: "currency",
      currency: USD,
      trend: { direction: "up", changePercent: 8, comparedTo: "önceki ay" },
      sparkline: [81.2, 86.2, 85.2, 93.1, 96.2, 98.1, 99.6],
      aiInsight: "Büyüme adetten değil, ortalama sepet tutarından geliyor.",
      confidence: 92,
      forecast: { value: 104_800, horizon: "30 gün", confidence: 78 },
      risk: "low",
      evidence: adsEvidence().slice(0, 2),
    }),
    kpi({
      id: "am-kpi-gross-profit",
      label: "Gross Profit (ücretler hariç)",
      value: 62_860,
      unit: "currency",
      currency: USD,
      trend: { direction: "down", changePercent: 4, comparedTo: "önceki ay" },
      sparkline: [66.9, 66.3, 65.3, 64.4, 64.0, 63.4, 62.9],
      aiInsight:
        "Bu NET KÂR DEĞİLDİR: Amazon ücretleri, COGS, iade ve nakliye düşülmemiştir. Net kâr COGS girilene kadar hesaplanamaz.",
      confidence: 84,
      forecast: { value: 61_430, horizon: "30 gün", confidence: 66 },
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
      value: 45_950,
      unit: "currency",
      currency: USD,
      trend: { direction: "down", changePercent: 9, comparedTo: "önceki ay" },
      sparkline: [52.6, 51.4, 49.8, 48.6, 47.4, 46.5, 45.9],
      aiInsight: "Düşüş satıştan; yeniden sipariş açılmazsa 3 hafta içinde riskli.",
      confidence: 86,
      forecast: { value: 39_050, horizon: "30 gün", confidence: 73 },
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
      spend: { amount: 3_187, currency: USD },
      sales: { amount: 17_608, currency: USD },
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

/**
 * Sağlık skoru → durum eşikleri. **BACKEND POLİTİKASIDIR**, arayüz bunu
 * render için ASLA kullanmaz; mock burada backend'in yerine geçtiği için
 * duruyor ve `amazon.test.ts` mock'un kendi politikasına uyduğunu doğrular.
 *
 * Eşikler olmadan `status` ile `healthScore` sessizce çelişiyordu: SKU-4102
 * skoru 55 iken "İzlemede", SKU-1188 skoru 64 iken "Riskli" idi — daha kötü
 * skorlu SKU daha iyi etiketliydi (S6 kapanışında yakalandı, UI-ADR-104).
 */
export const SKU_STATUS_BANDS = [
  { min: 80, status: "healthy" as const },
  { min: 65, status: "watch" as const },
  { min: 45, status: "at_risk" as const },
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
    status: "healthy",
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
      status: "at_risk",
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
      status: "watch",
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
      status: "healthy",
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
      status: "healthy",
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
      status: "at_risk",
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
      status: "at_risk",
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
      status: "watch",
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
