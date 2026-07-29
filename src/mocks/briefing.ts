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
  ConfidenceComponent,
  AIRecommendation,
  Alert,
  Decision,
  DirectorHeartbeat,
  EvidenceRef,
  ExecutiveBrief,
  ExecutiveKPI,
  MetricValue,
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

/**
 * Kanonik `DecisionRecord` mock'u — UI-ADR-105.
 *
 * Alanlar `schemas/decision-record.schema.json` ile birebirdir; eski
 * "Decision DNA" alanlarının (strategicImpact · expectedROI · executionComplexity
 * · directorOpinions · timeline · score) ODIN'de karşılığı YOKTU ve
 * uydurulmuyorlar. `financialImpact` ile `riskLevel` opsiyonel bırakıldı:
 * doküman istiyor, ODIN üretmiyor — gelmezse ekranda satır hiç çizilmez.
 */

/** Güven kırılımı — `odin/trust.py::CONFIDENCE_COMPONENTS` sekiz bileşeni. */
function breakdown(over: Partial<Record<string, number>> = {}): ConfidenceComponent[] {
  const base: [string, string, number, number, "positive" | "negative"][] = [
    ["knowledge_coverage", "Bilgi kapsamı", 82, 20, "positive"],
    ["evidence_strength", "Kanıt gücü", 88, 20, "positive"],
    ["expert_agreement", "Uzman uzlaşması", 74, 15, "positive"],
    ["model_agreement", "Model uzlaşması", 79, 10, "positive"],
    ["historical_success", "Geçmiş başarı", 71, 15, "positive"],
    ["risk_level", "Risk seviyesi", 45, 10, "negative"],
    ["missing_information", "Eksik bilgi", 30, 5, "negative"],
    ["decision_complexity", "Karar karmaşıklığı", 38, 5, "negative"],
  ];
  return base.map(([key, label, score, weight, direction]) => ({
    key,
    label,
    score: over[key] ?? score,
    weight,
    direction,
  }));
}

export function decisionsMock(): DataEnvelope<Decision[]> {
  const ev = evidence();

  return mockEnvelope([
    {
      id: "dec-ppc",
      date: ago(3 * 60 * 60_000),
      question: "Amazon PPC bütçesini %7 artırmalı mıyız?",
      /* D2: gerekçe zorunlu (§15.1-C). */
      tier: "D2",
      domain: "amazon",
      status: "open",
      humanDecision: null,
      reason:
        "Gösterim payı iki haftadır düşüyor; kademeli bütçe artışı kârı korurken satış kaybını durduruyor.",
      expectedOutcome: "30 gün içinde ACOS %17 bandına iner, satış hacmi korunur.",
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
      recommendation: {
        text: "PPC bütçesini %7 artır, 7 gün sonra tekrar değerlendir.",
        confidence: 96,
        confidenceBreakdown: breakdown(),
        evidenceSnapshot: ev,
        risks: [
          "Kur artarsa birim maliyet yükselir",
          "Nakit akışı bir hafta sıkışabilir",
        ],
        assumptions: [
          "Dönüşüm oranı son 14 günün ortalamasında kalır",
          "Rakip teklifleri bu hafta daha fazla yükselmez",
        ],
        consensusScore: 91,
        /* TÜRETİLMİŞ: 100 − 91. Ayrı bir ölçüm değildir. */
        disagreementScore: 9,
        minorityOpinions: [
          {
            member: "Trading AI",
            option: "Bütçeyi sabit tut",
            rationale: "USD yukarı gidiyor; 48 saat beklemek maliyeti düşürebilir.",
          },
        ],
        flipConditions: [
          "Gösterim payı 7 gün içinde %28'in üzerine kendiliğinden dönerse",
          "USD/TRY %3'ten fazla yükselirse",
          "Dönüşüm oranı %9'un altına inerse",
        ],
      },
      monitoringCheckpoints: [
        {
          id: "cp-ppc-7d",
          at: ahead(7 * 24 * 60 * 60_000),
          metric: "ACOS",
          expected: "%17 veya altı",
        },
      ],
      financialImpact: { amount: 82_000, currency: "TRY", horizon: "30 gün" },
      riskLevel: "medium",
      relatedDecisions: ["dec-stock"],
    },
    {
      id: "dec-stock",
      date: ago(5 * 60 * 60_000),
      question: "SKU-1042 için acil tedarik siparişi açmalı mıyız?",
      /* D1: en ağır kademe, gerekçe zorunlu. */
      tier: "D1",
      domain: "operations",
      status: "open",
      humanDecision: null,
      reason:
        "Tahmini tükenme 9 gün, tedarik süresi 21 gün. Sipariş bugün açılmazsa stoksuz kalınıyor.",
      expectedOutcome: "Stoksuz gün sayısı sıfır kalır, BuyBox korunur.",
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
      recommendation: {
        text: "SKU-1042 için 600 adetlik acil sipariş aç.",
        confidence: 88,
        confidenceBreakdown: breakdown({ historical_success: 64, missing_information: 45 }),
        evidenceSnapshot: ev.slice(0, 2),
        risks: ["Hava kargo birim maliyeti %14 daha yüksek"],
        assumptions: [
          "Günlük satış hızı 63 adet civarında kalır",
          "Tedarikçi 6 günlük hava kargo taahhüdünü tutar",
        ],
        consensusScore: 86,
        disagreementScore: 14,
        minorityOpinions: [],
        flipConditions: [
          "Satış hızı günlük 45 adetin altına inerse",
          "Tedarikçi teslim süresini 10 günün üzerine çıkarırsa",
        ],
      },
      financialImpact: { amount: 128_000, currency: "TRY", horizon: "45 gün" },
      riskLevel: "high",
      relatedDecisions: ["dec-ppc"],
    },
    {
      id: "dec-fx",
      date: ago(9 * 60 * 60_000),
      question: "USD pozisyonunun %30'unu kapatmalı mıyız?",
      tier: "D1",
      domain: "trading",
      status: "open",
      humanDecision: null,
      reason:
        "Kur oynaklığı arttı. Kısmi kapanış ithalat maliyetini sabitler, yukarı potansiyeli sınırlar.",
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
      recommendation: {
        text: "USD pozisyonunun %30'unu kapat.",
        confidence: 62,
        confidenceBreakdown: breakdown({
          evidence_strength: 58,
          expert_agreement: 51,
          missing_information: 62,
          decision_complexity: 66,
        }),
        evidenceSnapshot: [ev[2]!],
        risks: ["Kur geri çekilirse kazanç kaçar", "İşlem maliyeti geri alınamaz"],
        assumptions: ["Oynaklık bandı iki standart sapmanın üzerinde kalır"],
        consensusScore: 62,
        disagreementScore: 38,
        minorityOpinions: [
          {
            member: "Finance AI",
            option: "Pozisyonu koru",
            rationale: "Nakit ihtiyacı yok; kapanış işlem maliyeti gereksiz.",
          },
        ],
        flipConditions: ["Oynaklık bandı bir standart sapmanın altına inerse"],
      },
      financialImpact: { amount: 54_000, currency: "TRY", horizon: "14 gün" },
      riskLevel: "critical",
    },
    {
      id: "dec-listing",
      date: ago(26 * 60 * 60_000),
      question: "Üç SKU'nun başlık ve bullet metinleri güncellensin mi?",
      /* D3: tek tık yeter, gerekçe istenmez (§15.1-C). */
      tier: "D3",
      domain: "amazon",
      status: "open",
      humanDecision: null,
      reason: "Anahtar kelime kapsamı düşük; güncelleme organik trafiği artırabilir.",
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
      recommendation: {
        text: "Üç SKU'nun başlık ve bulletlarını birlikte güncelle.",
        confidence: 74,
        confidenceBreakdown: breakdown({ knowledge_coverage: 66, historical_success: 58 }),
        evidenceSnapshot: ev.slice(0, 1),
        risks: ["Sıralama kısa süreli dalgalanabilir"],
        assumptions: ["Mevcut görseller değişmeyecek"],
        consensusScore: 78,
        disagreementScore: 22,
        minorityOpinions: [],
        flipConditions: ["Amazon listeleme politikası bu ay değişirse"],
      },
      financialImpact: { amount: 19_000, currency: "TRY", horizon: "60 gün" },
      riskLevel: "low",
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

/** Kapanmış karar — insan kararı ve gerekçesi kayıtta (§15.1-C, §15.2-B). */
export function closedDecisionMock(): DataEnvelope<Decision> {
  const base = decisionsMock().data[3]!;
  return mockEnvelope({
    ...base,
    id: "dec-listing-closed",
    status: "closed",
    humanDecision: {
      outcome: "rejected",
      decidedBy: "human-owner",
      reasoning: "Görsel yenileme ile birlikte yapılsın; iki kez yayına almayalım.",
      decidedAt: ago(2 * 60 * 60_000),
    },
    actualOutcome: "Güncelleme Q3 görsel çalışmasına bağlandı.",
  } satisfies Decision);
}

/* --------------------------------------------------------------------------
   Kritik riskler — 05-dashboard.md §3.3 (09-...md §6 Alert sözleşmesi)
   -------------------------------------------------------------------------- */

/* FR-0046 v1 Alert (UI-ADR-106): `source` GERÇEK üretici kimliğidir
   (improvement_detectors · finance_quality · amazon_director · innovation).
   ODIN'de karşılığı olmayan bir üretici mock'ta da uydurulmaz — eski
   "trading" kur uyarısı bu yüzden düştü: o üretici yok. */
export function risksMock(): DataEnvelope<Alert[]> {
  return mockEnvelope([
    {
      id: "amazon_director.buybox_loss.3sku",
      source: "amazon_director",
      severity: "critical",
      title: "BuyBox kaybı — 3 SKU",
      summary: "Fiyat rekabeti nedeniyle üç SKU'da BuyBox kaybedildi.",
      requiresAction: true,
      asOf: ago(12 * 60_000),
    },
    {
      id: "amazon_director.stockout_risk.sku-1042",
      source: "amazon_director",
      severity: "high",
      title: "Stok tükenme riski — SKU-1042",
      summary: "Tahmini tükenme 9 gün. Tedarik süresi 21 gün.",
      requiresAction: true,
      asOf: ago(3 * 60 * 60_000),
    },
    {
      id: "finance_quality.margin_squeeze.2026-07",
      source: "finance_quality",
      severity: "medium",
      title: "Net kâr marjı %4 daraldı",
      summary: "Reklam harcaması sabit kalırken satış hacmi düştü.",
      requiresAction: true,
      asOf: ago(90 * 60_000),
    },
    /* severity ATLANDI (null değil): bu üreticinin belgelenmiş önem eşlemesi
       yok — rozetsiz listelenir, bilinenlerden sonra sıralanır. */
    {
      id: "improvement_detectors.listing_error.sku-3310",
      source: "improvement_detectors",
      title: "Listeleme hatası — SKU-3310",
      summary: "Görsel çözünürlüğü Amazon eşiğinin altında.",
      requiresAction: true,
      asOf: ago(26 * 60 * 60_000),
    },
    /* requiresAction:false → listeye GİRMEZ, elendiği altta yazılır. */
    {
      id: "amazon_director.spapi_sync.done",
      source: "amazon_director",
      severity: "low",
      title: "Günlük senkronizasyon tamamlandı",
      summary: "Bilgi amaçlı — aksiyon gerektirmez.",
      requiresAction: false,
      asOf: ago(30 * 60_000),
    },
  ] satisfies Alert[]);
}

/* --------------------------------------------------------------------------
   Fırsatlar — 05-dashboard.md §3.4 (risklerle EŞİT görsel ağırlık)
   -------------------------------------------------------------------------- */

/* FR-0046 v1 Opportunity (UI-ADR-106): suggestedAction ZORUNLU düz metin;
   parasal etki (`estimatedImpact`) v1'de YOK — kaynağı kanıtlanmadan
   "Gelir etkisi" yazılmaz. */
export function opportunitiesMock(): DataEnvelope<Opportunity[]> {
  return mockEnvelope([
    {
      id: "amazon_director.keyword.rising-term",
      source: "amazon_director",
      title: "Yükselen anahtar kelimeye bütçe kaydır",
      summary: "Terim 14 günde gösterim payı kazandı; mevcut kampanyalar zayıf konumda.",
      suggestedAction: "Terimi kazanan kampanyaya exact match olarak ekle, 7 gün CPC izle.",
      evidence: ["keyword:katlanır kamp sandalyesi", "metric:impression_share"],
      asOf: ago(55 * 60_000),
    },
    {
      id: "innovation.bundle.sku-1188-2001",
      source: "innovation",
      title: "SKU-1188 + SKU-2001 paket satışı",
      summary: "İki ürün aynı sepette sık görülüyor; paket, masa stok baskısını hafifletir.",
      suggestedAction: "Paket listing oluştur ve 21 gün dönüşümünü ölç.",
      evidence: ["sku:SKU-1188", "sku:SKU-2001"],
      asOf: ago(5 * 60 * 60_000),
    },
  ] satisfies Opportunity[]);
}

/* --------------------------------------------------------------------------
   Executive KPI'lar — 05-dashboard.md §3.5 (dokümandaki 9 kalem, aynı sırada)
   -------------------------------------------------------------------------- */

/* FR-0046 v1 (UI-ADR-106): değerler {status, value, reason} zarfındadır.
   Trend · sparkline · AI yorumu · forecast · risk · öneri BİLEREK YOK —
   kaynakları ODIN'de üretilmiyor (R-006 FR-0043) ve anti-fake mock'ta da
   geçerlidir; kartlar bu katmanları NoData ile söyler. */
const val = (n: number): MetricValue => ({ status: "available", value: n });

function kpi(
  over: Partial<ExecutiveKPI> &
    Pick<ExecutiveKPI, "id" | "metricKey" | "label" | "value" | "unit">
): ExecutiveKPI {
  return { asOf: ago(30 * 60_000), source: "briefing", ...over };
}

export function kpisMock(): DataEnvelope<ExecutiveKPI[]> {
  return mockEnvelope([
    kpi({
      id: "company.revenue",
      metricKey: "revenue",
      label: "Revenue",
      value: val(4_182_000),
      unit: "currency",
      currencyCode: "TRY",
    }),
    kpi({
      id: "company.net_profit",
      metricKey: "net_profit",
      label: "Net Profit",
      value: val(1_284_000),
      unit: "currency",
      currencyCode: "TRY",
    }),
    kpi({
      id: "company.cash_flow",
      metricKey: "cash_flow",
      label: "Cash Flow",
      value: val(862_000),
      unit: "currency",
      currencyCode: "TRY",
    }),
    kpi({
      id: "amazon.health_score",
      metricKey: "health_score",
      label: "Amazon",
      value: val(78),
      unit: "score",
      source: "amazon_director",
    }),
    kpi({
      id: "amazon.inventory_health",
      metricKey: "inventory_health",
      label: "Inventory",
      value: val(63.4),
      unit: "percent",
      /* UI-ADR-093 — ölçek BİLDİRİLİR. Bu alan olmasaydı kart boş görünürdü. */
      scale: "0-100",
      source: "amazon_director",
    }),
    kpi({
      id: "council.ai_confidence",
      metricKey: "ai_confidence",
      label: "AI Confidence",
      value: val(88),
      unit: "score",
      source: "trust",
    }),
    /* --- Ölçüm kaynağı olmayan iki KPI: değer UYDURULMAZ. ---
       telemetry registry'de `knowledge_sync` ve `memory_indexing` kanalları
       `available: false`. Kart çizilir; zarf durumu ve GEREKÇESİ gelir,
       sayı alanı null kalır (ADR-0135 sınırı). */
    kpi({
      id: "knowledge.health",
      metricKey: "knowledge_health",
      label: "Knowledge Health",
      value: {
        status: "unavailable",
        value: null,
        reason: "knowledge_sync telemetri kanalı kapalı; skor üretilmiyor.",
      },
      unit: "score",
      source: "knowledge",
    }),
    kpi({
      id: "memory.health",
      metricKey: "memory_health",
      label: "Memory Health",
      value: {
        status: "unavailable",
        value: null,
        reason: "memory_indexing telemetri kanalı kapalı; skor üretilmiyor.",
      },
      unit: "score",
      source: "knowledge",
    }),
    kpi({
      id: "executive.decision_confidence",
      metricKey: "decision_confidence",
      label: "Decision Confidence",
      value: val(81),
      unit: "score",
      source: "executive",
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
