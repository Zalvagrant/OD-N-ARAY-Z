/**
 * Executive Briefing mock verisi — UI-ADR-094.
 *
 * ⚠️ HEPSİ MOCK. Zarfların `meta.source` alanı istisnasız `"mock"`tur.
 *
 * ANTI-FAKE, MOCK'TA DA GEÇERLİ:
 *  - Karşılığı olmayan alan doldurulmaz. `Knowledge Health` ve `Memory Health`
 *    KPI'ları ölçüm kaynağı OLMADIĞI için (telemetry registry'de
 *    `knowledge_sync` / `memory_indexing` kanalları `available: false`)
 *    değersiz gelir ve ekranda NoData çıkar. Bu bir eksiklik değil, kuralın
 *    çalıştığının kanıtıdır.
 *  - `aiReadiness` sözleşmede yok → `null` (13-...md §14.1).
 *  - Yüzde KPI'ında `scale` doldurulur (UI-ADR-093); doldurulmasaydı kart
 *    bilerek boş görünürdü.
 *
 * Değerler bir üretici fonksiyonun içindedir: `Date.now()` modül yüklenirken
 * değil, istemcide çağrıldığında okunur (hydration güvenliği).
 */

import type { TimelineItem } from "@/components/ui/timeline";
import type { DataEnvelope } from "@/types/data-envelope";
import type {
  AIRecommendation,
  Alert,
  Decision,
  DirectorHeartbeat,
  EvidenceRef,
  ExecutiveBrief,
  ExecutiveKPI,
  Opportunity,
  PulseChannelStates,
} from "@/types/executive";
import type { ExecutiveHero } from "@/types/screens";
import { ago, ahead, mockEnvelope } from "./envelope";

/* --------------------------------------------------------------------------
   Kanıt ve öneri — açıklanabilirlik sözleşmesinin 7 alanı eksiksiz
   -------------------------------------------------------------------------- */

function evidence(): EvidenceRef[] {
  return [
    {
      id: "ev-acos",
      type: "metric",
      title: "ACOS son 14 gün",
      excerpt: "ACOS %18,1'e yükseldi; harcama sabit, satış düştü.",
      sourceQuality: 92,
      freshness: ago(30 * 60_000),
      supportsOrContradicts: "supports",
    },
    {
      id: "ev-impression",
      type: "metric",
      title: "Gösterim payı",
      excerpt: "Gösterim payı %31'den %24'e indi.",
      sourceQuality: 88,
      freshness: ago(45 * 60_000),
      supportsOrContradicts: "supports",
    },
    {
      id: "ev-usd",
      type: "external",
      title: "USD/TRY 72 saatlik görünüm",
      excerpt: "Kur yukarı yönlü; ithalat maliyeti artabilir.",
      sourceQuality: 64,
      freshness: ago(3 * 60 * 60_000),
      supportsOrContradicts: "contradicts",
    },
  ];
}

function ppcRecommendation(): AIRecommendation {
  return {
    id: "rec-ppc-budget",
    recommendation: "Amazon PPC bütçesini %7 artır, 7 gün sonra tekrar değerlendir.",
    numbers: { ACOS: 18.1, TACOS: 9.4, "Harcama (USD)": 2420, "Satış (USD)": 18300 },
    causeAnalysis: "Rakip teklifleri yükseldi, gösterim payı %31'den %24'e indi.",
    impactAnalysis: "Mevcut tempoda aylık net kârda ~₺46.000 kayıp riski var.",
    alternatives: [
      {
        title: "%7 artır",
        description: "Kademeli artış, 7 gün sonra ölçüm.",
        expectedOutcome: "Gösterim payı toparlanır, ACOS ~%17'ye iner.",
        risk: "low",
      },
      {
        title: "Bütçeyi sabit tut",
        description: "Kur riski geçene kadar bekle.",
        expectedOutcome: "Nakit korunur, satış kaybı sürer.",
        risk: "medium",
      },
    ],
    expectedFinancialResult: { amount: 82_000, currency: "TRY" },
    confidence: 96,
    evidence: evidence(),
    whyGenerated: "ACOS 14 gündür yükseliyor ve gösterim payı eşiğin altına indi.",
    responsibleDirector: "Amazon AI",
    relatedKnowledge: ["PPC oynaklık politikası", "2026-05 bütçe kararı"],
    lastValidated: ago(15 * 60_000),
    potentialRisks: [
      "Kur artarsa birim maliyet yükselir",
      "Nakit akışı bir hafta sıkışabilir",
    ],
  };
}

function stockRecommendation(): AIRecommendation {
  return {
    id: "rec-stock",
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
    expectedFinancialResult: { amount: 128_000, currency: "TRY" },
    confidence: 88,
    evidence: evidence().slice(0, 2),
    whyGenerated: "Tahmini tükenme süresi tedarik süresinin altına indi.",
    responsibleDirector: "Amazon AI",
    relatedKnowledge: ["Tedarik süresi tablosu", "2026-Q2 stok politikası"],
    lastValidated: ago(40 * 60_000),
    potentialRisks: ["Hava kargo birim maliyeti %14 daha yüksek"],
  };
}

/* --------------------------------------------------------------------------
   Hero — 05-dashboard.md §3.1
   -------------------------------------------------------------------------- */

export function heroMock(): DataEnvelope<ExecutiveHero> {
  return mockEnvelope(
    {
      executiveSummary:
        "Bugün üç kritik karar bekliyor. Amazon tarafında ACOS iki haftadır yükseliyor ve net kâr marjı %4 aşındı. Nakit akışı güvenli; asıl risk tedarik tarafında.",
      todaysMission: "PPC verimliliğini toparlamak ve SKU-1042 tükenmesini önlemek",
      currentFocus: "Amazon PPC bütçe kararı — 3 gün içinde etkisi ölçülebilir",
      systemHealthScore: 94,
      /* Sözleşmede karşılığı yok → uydurulmaz (13-...md §14.1). */
      aiReadiness: null,
    },
    { confidence: 91 }
  );
}

/* --------------------------------------------------------------------------
   Kritik kararlar — 05-dashboard.md §3.2
   -------------------------------------------------------------------------- */

export function decisionsMock(): DataEnvelope<Decision[]> {
  const rec = ppcRecommendation();
  const ev = evidence();

  return mockEnvelope([
    {
      id: "dec-ppc",
      type: "amazon",
      title: "Amazon PPC bütçesini %7 artır",
      executiveSummary:
        "Gösterim payı iki haftadır düşüyor. Kademeli bütçe artışı kârı korurken satış kaybını durduruyor.",
      priority: 1,
      status: "under_review",
      strategicImpact: "medium",
      financialImpact: { amount: 82_000, currency: "TRY", horizon: "30 gün" },
      riskLevel: "medium",
      aiConfidence: 96,
      evidenceQuality: 91,
      reversibility: "reversible",
      executionComplexity: "low",
      expectedROI: 2.4,
      directorOpinions: [
        {
          directorId: "Amazon AI",
          position: "support",
          argument: "PPC artırılmalı; gösterim payı kaybı satış kaybına dönüştü.",
          confidence: 94,
          evidence: [ev[0]!],
        },
        {
          directorId: "Finance AI",
          position: "neutral",
          argument: "Nakit akışı uygun ama hafta sonu ödemeleri sıkışık.",
          confidence: 71,
          evidence: [],
        },
        {
          directorId: "Trading AI",
          position: "oppose",
          argument: "USD yukarı gidiyor; 48 saat beklemek maliyeti düşürebilir.",
          confidence: 68,
          evidence: [ev[2]!],
        },
      ],
      consensus: 91,
      disagreement: 9,
      minorityOpinion: {
        directorId: "Trading AI",
        position: "oppose",
        argument: "USD riski nedeniyle 48 saat beklenmesini öneriyorum.",
        confidence: 68,
        evidence: [ev[2]!],
      },
      alternatives: rec.alternatives,
      evidence: ev,
      relatedDecisions: [],
      timeline: [],
      recommendation: rec,
    },
    {
      id: "dec-stock",
      type: "operations",
      title: "SKU-1042 için acil tedarik siparişi",
      executiveSummary:
        "Tahmini tükenme 9 gün, tedarik süresi 21 gün. Sipariş bugün açılmazsa stoksuz kalınıyor.",
      priority: 1,
      status: "proposed",
      strategicImpact: "high",
      financialImpact: { amount: 128_000, currency: "TRY", horizon: "45 gün" },
      riskLevel: "high",
      aiConfidence: 88,
      evidenceQuality: 84,
      reversibility: "partially",
      executionComplexity: "medium",
      expectedROI: 1.9,
      directorOpinions: [
        {
          directorId: "Amazon AI",
          position: "support",
          argument: "Stoksuz kalmak sıralama kaybı demek; toparlanması 6 hafta sürer.",
          confidence: 90,
          evidence: [ev[1]!],
        },
        {
          directorId: "Finance AI",
          position: "support",
          argument: "Nakit çıkışı planlanabilir, ödeme 30 gün vadeli.",
          confidence: 79,
          evidence: [],
        },
      ],
      consensus: 86,
      disagreement: 14,
      alternatives: stockRecommendation().alternatives,
      evidence: ev.slice(0, 2),
      relatedDecisions: ["dec-ppc"],
      timeline: [],
      recommendation: stockRecommendation(),
    },
    {
      id: "dec-fx",
      type: "trading",
      title: "USD pozisyonunun %30'unu kapat",
      executiveSummary:
        "Kur oynaklığı arttı. Kısmi kapanış ithalat maliyetini sabitler, yukarı potansiyeli sınırlar.",
      priority: 2,
      /* Bayat veri → onay KİLİTLİ (UI-ADR-092). Kural ekranda görünsün diye
         bilerek eski bir zaman damgası taşıyor. */
      status: "under_review",
      strategicImpact: "medium",
      financialImpact: { amount: 54_000, currency: "TRY", horizon: "14 gün" },
      riskLevel: "critical",
      aiConfidence: 62,
      evidenceQuality: 58,
      reversibility: "irreversible",
      executionComplexity: "low",
      expectedROI: 1.2,
      directorOpinions: [
        {
          directorId: "Trading AI",
          position: "support",
          argument: "Oynaklık bandı iki standart sapmayı aştı.",
          confidence: 62,
          evidence: [ev[2]!],
        },
      ],
      consensus: 62,
      disagreement: 31,
      alternatives: [
        {
          title: "%30 kapat",
          description: "Maliyeti sabitle.",
          expectedOutcome: "İthalat maliyeti öngörülebilir olur.",
          risk: "low",
        },
        {
          title: "Pozisyonu koru",
          description: "Kur beklentisi yukarı yönlü.",
          expectedOutcome: "Yukarı potansiyel korunur, risk sürer.",
          risk: "high",
        },
      ],
      evidence: [ev[2]!],
      relatedDecisions: [],
      timeline: [],
    },
    {
      id: "dec-listing",
      type: "amazon",
      title: "3 SKU için başlık ve bullet güncellemesi",
      executiveSummary:
        "Anahtar kelime kapsamı düşük. Güncelleme organik trafiği artırabilir.",
      priority: 3,
      status: "collecting_evidence",
      strategicImpact: "low",
      financialImpact: { amount: 19_000, currency: "TRY", horizon: "60 gün" },
      riskLevel: "low",
      aiConfidence: 74,
      evidenceQuality: 66,
      reversibility: "reversible",
      executionComplexity: "low",
      expectedROI: 3.1,
      directorOpinions: [],
      consensus: 0,
      disagreement: 0,
      alternatives: [
        {
          title: "Üç SKU'yu birlikte güncelle",
          description: "Tek seferde yayına al.",
          expectedOutcome: "Etki 3 hafta içinde ölçülür.",
          risk: "low",
        },
        {
          title: "Önce tek SKU ile test et",
          description: "A/B ölçümü yap.",
          expectedOutcome: "Daha yavaş ama ölçülebilir.",
          risk: "low",
        },
      ],
      evidence: [],
      relatedDecisions: [],
      timeline: [],
    },
  ] satisfies Decision[]);
}

/** Bayat zarf — onay kilidi kuralı ekranda görünsün diye ayrı zarfta. */
export function staleDecisionMock(): DataEnvelope<Decision> {
  const all = decisionsMock().data;
  return mockEnvelope(all.find((d) => d.id === "dec-fx")!, {
    lastUpdated: ago(6 * 60 * 60_000),
    freshness: "stale",
  });
}

/* --------------------------------------------------------------------------
   Kritik riskler — 05-dashboard.md §3.3 (09-...md §6 Alert sözleşmesi)
   -------------------------------------------------------------------------- */

export function risksMock(): DataEnvelope<Alert[]> {
  return mockEnvelope([
    {
      id: "al-buybox",
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
      id: "al-stock",
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
      id: "al-fx",
      severity: "risk",
      title: "Kur oynaklığı ithalat maliyetini tehdit ediyor",
      description: "USD/TRY 72 saatte %2,4 yükseldi.",
      module: "trading",
      affectedEntities: ["USD/TRY"],
      responsibleDirector: "Trading AI",
      requiresAction: true,
      createdAt: ago(5 * 60 * 60_000),
    },
    {
      id: "al-margin",
      severity: "warning",
      title: "Net kâr marjı %4 daraldı",
      description: "Reklam harcaması sabit kalırken satış hacmi düştü.",
      module: "finance",
      affectedEntities: [],
      suggestedMitigation: "PPC bütçe kararını bugün sonuçlandır.",
      responsibleDirector: "Finance AI",
      requiresAction: true,
      createdAt: ago(90 * 60_000),
    },
    /* requiresAction:false → listeye GİRMEZ, elendiği altta yazılır. */
    {
      id: "al-sync",
      severity: "info",
      title: "Günlük senkronizasyon tamamlandı",
      description: "Bilgi amaçlı — aksiyon gerektirmez.",
      module: "system",
      affectedEntities: [],
      responsibleDirector: "System",
      requiresAction: false,
      createdAt: ago(30 * 60_000),
    },
  ] satisfies Alert[]);
}

/* --------------------------------------------------------------------------
   Fırsatlar — 05-dashboard.md §3.4 (risklerle EŞİT görsel ağırlık)
   -------------------------------------------------------------------------- */

export function opportunitiesMock(): DataEnvelope<Opportunity[]> {
  return mockEnvelope([
    {
      id: "opp-keyword",
      title: "Yükselen anahtar kelimeye bütçe kaydır",
      category: "keyword",
      revenueImpact: { amount: 64_000, currency: "TRY" },
      confidence: 83,
      deadline: ahead(7 * 24 * 60 * 60_000),
      recommendedAction: ppcRecommendation(),
      evidence: evidence(),
    },
    {
      id: "opp-bundle",
      title: "SKU-1188 + SKU-2001 paket satışı",
      category: "bundle",
      revenueImpact: { amount: 41_000, currency: "TRY" },
      confidence: 71,
      deadline: ahead(21 * 24 * 60 * 60_000),
      recommendedAction: stockRecommendation(),
      evidence: evidence().slice(0, 2),
    },
  ] satisfies Opportunity[]);
}

/* --------------------------------------------------------------------------
   Executive KPI'lar — 05-dashboard.md §3.5 (dokümandaki 9 kalem, aynı sırada)
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
    owner: "",
    ...over,
  };
}

export function kpisMock(): DataEnvelope<ExecutiveKPI[]> {
  const rec = ppcRecommendation();

  return mockEnvelope([
    kpi({
      id: "kpi-revenue",
      label: "Revenue",
      value: 4_182_000,
      unit: "currency",
      currency: "TRY",
      trend: { direction: "up", changePercent: 8, comparedTo: "önceki ay" },
      sparkline: [3_410, 3_620, 3_580, 3_910, 4_040, 4_120, 4_182],
      aiInsight: "Büyüme adetten değil, ortalama sepet tutarından geliyor.",
      confidence: 92,
      forecast: { value: 4_400_000, horizon: "30 gün", confidence: 78 },
      risk: "low",
      evidence: evidence(),
      owner: "Finance AI",
    }),
    kpi({
      id: "kpi-net-profit",
      label: "Net Profit",
      value: 1_284_000,
      unit: "currency",
      currency: "TRY",
      trend: { direction: "down", changePercent: 4, comparedTo: "önceki ay" },
      sparkline: [1_402, 1_388, 1_371, 1_340, 1_318, 1_296, 1_284],
      aiInsight: "Daralma reklam verimliliğinden; hacim değil, ACOS baskı yapıyor.",
      confidence: 89,
      forecast: { value: 1_240_000, horizon: "30 gün", confidence: 71 },
      risk: "medium",
      recommendedAction: rec,
      evidence: evidence(),
      owner: "Finance AI",
    }),
    kpi({
      id: "kpi-cash-flow",
      label: "Cash Flow",
      value: 862_000,
      unit: "currency",
      currency: "TRY",
      trend: { direction: "up", changePercent: 3, comparedTo: "önceki ay" },
      sparkline: [790, 812, 806, 828, 840, 851, 862],
      aiInsight: "Tahsilat vadeleri kısaldı; hafta sonu ödemeleri hâlâ yoğun.",
      confidence: 84,
      forecast: { value: 810_000, horizon: "30 gün", confidence: 63 },
      risk: "low",
      evidence: evidence().slice(0, 1),
      owner: "Finance AI",
    }),
    kpi({
      id: "kpi-amazon",
      label: "Amazon",
      value: 78,
      unit: "score",
      trend: { direction: "down", changePercent: 6, comparedTo: "geçen hafta" },
      sparkline: [88, 87, 85, 83, 81, 79, 78],
      aiInsight: "Sağlık skorunu düşüren tek kalem ACOS; stok ve iade normal.",
      confidence: 90,
      forecast: { value: 82, horizon: "14 gün", confidence: 66 },
      risk: "medium",
      recommendedAction: rec,
      evidence: evidence(),
      owner: "Amazon AI",
    }),
    kpi({
      id: "kpi-inventory",
      label: "Inventory",
      value: 63.4,
      unit: "percent",
      /* UI-ADR-093 — ölçek BİLDİRİLİR. Bu alan olmasaydı kart boş görünürdü. */
      scale: "0-100",
      trend: { direction: "down", changePercent: 11, comparedTo: "geçen hafta" },
      sparkline: [82, 79, 76, 72, 69, 66, 63.4],
      aiInsight: "Stok sağlığı SKU-1042 yüzünden düşüyor; diğer 40 SKU stabil.",
      confidence: 87,
      forecast: { value: 48, horizon: "14 gün", confidence: 74 },
      risk: "high",
      recommendedAction: stockRecommendation(),
      evidence: evidence().slice(0, 2),
      owner: "Amazon AI",
    }),
    kpi({
      id: "kpi-ai-confidence",
      label: "AI Confidence",
      value: 88,
      unit: "score",
      trend: { direction: "flat", changePercent: 0, comparedTo: "geçen hafta" },
      sparkline: [86, 87, 88, 87, 88, 88, 88],
      aiInsight: "Kurul ortalaması; son 30 kararda kalibrasyon sapması ±6 puan.",
      confidence: 88,
      forecast: { value: 88, horizon: "14 gün", confidence: 55 },
      risk: "none",
      evidence: evidence().slice(0, 1),
      owner: "Reasoning AI",
    }),
    /* --- Ölçüm kaynağı olmayan iki KPI: değer UYDURULMAZ. ---
       telemetry registry'de `knowledge_sync` ve `memory_indexing` kanalları
       `available: false`. Kart çizilir ama değeri NoData'dır. */
    kpi({
      id: "kpi-knowledge-health",
      label: "Knowledge Health",
      owner: "Knowledge AI",
    }),
    kpi({
      id: "kpi-memory-health",
      label: "Memory Health",
      owner: "Knowledge AI",
    }),
    kpi({
      id: "kpi-decision-confidence",
      label: "Decision Confidence",
      value: 81,
      unit: "score",
      trend: { direction: "up", changePercent: 5, comparedTo: "önceki çeyrek" },
      sparkline: [72, 74, 75, 78, 79, 80, 81],
      aiInsight: "Kanıt sayısı arttıkça karar güveni yükseliyor.",
      confidence: 81,
      forecast: { value: 84, horizon: "90 gün", confidence: 58 },
      risk: "none",
      evidence: evidence(),
      owner: "Executive AI",
    }),
  ]);
}

/* --------------------------------------------------------------------------
   Director aktivitesi — UI-ADR-074 ile DONDURULMUŞ 6 Director
   -------------------------------------------------------------------------- */

export function directorsMock(): DataEnvelope<DirectorHeartbeat[]> {
  const base = {
    beatIntervalMs: 5_000,
    memoryHealth: "healthy" as const,
    predictionStatus: "idle" as const,
  };

  return mockEnvelope([
    {
      ...base,
      directorId: "executive",
      name: "Executive AI",
      status: "reviewing",
      currentGoal: "Günün brifingini kapatmak",
      currentTask: "Üç kritik kararın sentezi hazırlanıyor",
      confidence: 91,
      taskCount: 8,
      queueLength: 1,
      evidenceCount: 64,
      recommendationCount: 3,
      predictionStatus: "running",
      lastBeat: ago(2_000),
    },
    {
      ...base,
      directorId: "amazon",
      name: "Amazon AI",
      status: "analyzing",
      currentGoal: "ACOS'u %16 altına indirmek",
      currentTask: "Kampanya B teklif eğrisi yeniden hesaplanıyor",
      confidence: 94,
      taskCount: 24,
      queueLength: 3,
      evidenceCount: 182,
      recommendationCount: 4,
      predictionStatus: "running",
      lastBeat: ago(3_000),
    },
    {
      ...base,
      directorId: "finance",
      name: "Finance AI",
      status: "monitoring",
      currentGoal: "Nakit akışını 30 gün ileriye kadar güvende tutmak",
      currentTask: "Hafta sonu ödeme planı doğrulanıyor",
      confidence: 79,
      taskCount: 11,
      queueLength: 0,
      evidenceCount: 96,
      recommendationCount: 1,
      lastBeat: ago(4_000),
    },
    {
      ...base,
      directorId: "trading",
      name: "Trading AI",
      /* lastBeat 3 aralıktan eski → kart OFFLINE'a düşer, nabız durur.
         Durum "analyzing" dese bile offline kazanır (10b §3). */
      status: "analyzing",
      currentGoal: "Kur riskini %2'nin altında tutmak",
      currentTask: "USD/TRY oynaklık bandı izleniyor",
      confidence: 62,
      taskCount: 6,
      queueLength: 2,
      evidenceCount: 41,
      recommendationCount: 1,
      lastBeat: ago(90_000),
    },
    {
      ...base,
      directorId: "knowledge",
      name: "Knowledge AI",
      /* Bilgi servisi bağlı değil → atım YOK. "offline" değil, BİLİNMİYOR. */
      status: "idle",
      currentGoal: null,
      currentTask: null,
      confidence: null,
      taskCount: 0,
      queueLength: 0,
      evidenceCount: 0,
      recommendationCount: 0,
      memoryHealth: "degraded",
      lastBeat: null,
    },
    {
      ...base,
      directorId: "reasoning",
      name: "Reasoning AI",
      status: "processing",
      currentGoal: "Kararlar arası çelişkileri tespit etmek",
      currentTask: "PPC ve kur kararları çapraz kontrol ediliyor",
      confidence: 86,
      taskCount: 4,
      queueLength: 1,
      evidenceCount: 58,
      recommendationCount: 2,
      predictionStatus: "running",
      lastBeat: ago(1_500),
    },
  ] satisfies DirectorHeartbeat[]);
}

/* --------------------------------------------------------------------------
   AI Brief · AI Core · Timeline
   -------------------------------------------------------------------------- */

export function briefMock(): DataEnvelope<ExecutiveBrief> {
  return mockEnvelope(
    {
      numbers: {
        "Net kâr (₺)": 1_284_000,
        ACOS: 18.1,
        "Gösterim payı (%)": 24,
        "Bekleyen karar": 4,
      },
      analysis:
        "ACOS artışı gösterim payı kaybından geliyor; harcama sabit kaldı, satış düştü.",
      interpretation:
        "Sorun bütçe değil, teklif seviyesidir. Mevcut tempoda aylık net kâr ~%4 daha aşınır.",
      recommendation: ppcRecommendation(),
      evidence: evidence(),
    },
    { confidence: 96 }
  );
}

export function pulseMock(): DataEnvelope<PulseChannelStates> {
  return mockEnvelope({
    processing: { active: true, load: 72, lastActivity: ago(5_000), available: true },
    memory_knowledge: {
      active: true,
      load: 31,
      lastActivity: ago(20_000),
      available: true,
    },
    prediction: {
      active: false,
      load: 0,
      lastActivity: ago(15 * 60_000),
      available: true,
    },
  });
}

export function timelineMock(): DataEnvelope<TimelineItem[]> {
  return mockEnvelope([
    {
      id: "tl-1",
      at: ago(8 * 60_000),
      title: "Risk arttı — kur oynaklığı",
      description: "USD/TRY bandı iki standart sapmayı aştı.",
      tone: "warning",
      actor: "Trading AI",
    },
    {
      id: "tl-2",
      at: ago(26 * 60_000),
      title: "Kanıt eklendi — gösterim payı ölçümü",
      description: "PPC kararına iki yeni metrik bağlandı.",
      tone: "ai",
      actor: "Amazon AI",
    },
    {
      id: "tl-3",
      at: ago(2 * 60 * 60_000),
      title: "Karar onaylandı — iade politikası güncellemesi",
      tone: "success",
      actor: "Sen",
    },
    {
      id: "tl-4",
      at: ago(5 * 60 * 60_000),
      title: "Otomasyon tamamlandı — günlük fiyat senkronu",
      tone: "neutral",
      actor: "Sistem",
    },
    {
      id: "tl-5",
      at: ago(9 * 60 * 60_000),
      title: "AI öğrendi — repricer eşiği geri bildirimi işlendi",
      tone: "ai",
      actor: "Reasoning AI",
    },
  ] satisfies TimelineItem[]);
}
