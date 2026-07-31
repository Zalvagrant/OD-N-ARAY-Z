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
  AgentHealth,
  Alert,
  Decision,
  EvidenceRef,
  ExecutiveBrief,
  ExecutiveKPI,
  PulseChannelStates,
  RuntimeDirector,
} from "@/types/executive";
import type { ExecutiveHero } from "@/types/screens";
import { ago, ahead, mockEnvelope } from "./envelope";

const today = () => new Date().toISOString().slice(0, 10);

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
    confidence: 71.4,
    /* 8 kanonik bileşen (trust.py ağırlıkları 20/20/15/10/15/10/5/5).
       risk_level/missing_information/decision_complexity NEGATİF yönlüdür. */
    confidenceBreakdown: {
      knowledge_coverage: 80,
      evidence_strength: 75,
      expert_agreement: 90,
      model_agreement: 70,
      historical_success: 65,
      risk_level: 40,
      missing_information: 30,
      decision_complexity: 35,
    },
    evidence: evidence(),
    potentialRisks: [
      "Kur artarsa birim maliyet yükselir",
      "Nakit akışı bir hafta sıkışabilir",
    ],
    assumptions: [
      "Rakip teklif seviyesi mevcut bandında kalır",
      "Dönüşüm oranı son 30 günün ortalamasından sapmaz",
    ],
    flipConditions: [
      "ACOS 7 gün içinde %20'yi aşarsa artış geri alınır",
      "USD/TRY %3'ten fazla yükselirse karar yeniden açılır",
    ],
    consensusScore: 66.7,
    disagreementScore: 33.3,
    minorityOpinions: ["trading: beklet — USD riski nedeniyle 48 saat beklenmeli"],
    recClass: "B",
    /* ODIN şemasında olmayan zenginleştirmeler (not_exposed, 09b §9) —
       kaynakları oluşana dek mock'ta da opsiyonel kalır. */
    numbers: { ACOS: 18.1, TACOS: 9.4, "Harcama (USD)": 2420, "Satış (USD)": 18300 },
    causeAnalysis: "Rakip teklifleri yükseldi, gösterim payı %31'den %24'e indi.",
    impactAnalysis: "Mevcut tempoda aylık net kârda ~₺46.000 kayıp riski var.",
    expectedFinancialResult: { amount: 82_000, currency: "TRY" },
    whyGenerated: "ACOS 14 gündür yükseliyor ve gösterim payı eşiğin altına indi.",
    responsibleDirector: "Amazon AI",
    lastValidated: ago(15 * 60_000),
  };
}

function stockRecommendation(): AIRecommendation {
  return {
    id: "rec-stock",
    recommendation: "SKU-1042 için 600 adetlik acil sipariş aç.",
    confidence: 62.9,
    confidenceBreakdown: {
      knowledge_coverage: 70,
      evidence_strength: 68,
      expert_agreement: 80,
      model_agreement: 60,
      historical_success: 55,
      risk_level: 55,
      missing_information: 40,
      decision_complexity: 45,
    },
    evidence: evidence().slice(0, 2),
    potentialRisks: ["Hava kargo birim maliyeti %14 daha yüksek"],
    assumptions: ["Günlük satış hızı (63 adet) önümüzdeki 3 hafta korunur"],
    flipConditions: [
      "Satış hızı %25 düşerse sipariş 300 adete indirilir",
      "Tedarikçi 10 günden kısa termin verirse hava kargo iptal edilir",
    ],
    consensusScore: 100,
    disagreementScore: 0,
    minorityOpinions: [],
    recClass: "B",
    numbers: { "Kalan gün": 9, "Tedarik süresi (gün)": 21, "Günlük satış": 63 },
    causeAnalysis: "Satış hızı üç haftada %22 arttı, sipariş planı güncellenmedi.",
    impactAnalysis: "Tükenme 12 gün stoksuz kalma demek; BuyBox ve sıralama kaybı.",
    expectedFinancialResult: { amount: 128_000, currency: "TRY" },
    whyGenerated: "Tahmini tükenme süresi tedarik süresinin altına indi.",
    responsibleDirector: "Amazon AI",
    lastValidated: ago(40 * 60_000),
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
  return mockEnvelope([
    {
      id: "dec-ppc",
      question: "Amazon PPC bütçesi %7 artırılsın mı?",
      date: today(),
      tier: "D2",
      status: "open",
      domain: "amazon",
      /* Alternatifler KARARIN alanı — şema minItems 2 (UI-ADR-100). */
      alternatives: [
        {
          option: "%7 artır",
          assessment: "Gösterim payı toparlanır, ACOS ~%17'ye iner.",
          risk: "low",
        },
        {
          option: "Bütçeyi sabit tut",
          assessment: "Nakit korunur, satış kaybı sürer.",
          risk: "medium",
        },
      ],
      recommendation: ppcRecommendation(),
      expectedOutcome: "Gösterim payı 2 hafta içinde %28 üzerine döner",
      monitoringCheckpoints: [ahead(7 * 24 * 60 * 60_000).slice(0, 10)],
    },
    {
      id: "dec-stock",
      question: "SKU-1042 için acil tedarik siparişi açılsın mı?",
      date: today(),
      tier: "D2",
      status: "open",
      domain: "operations",
      alternatives: [
        {
          option: "600 adet acil sipariş (hava kargo, 6 gün)",
          assessment: "Stoksuz gün sayısı 0; birim maliyet %14 yüksek.",
          risk: "medium",
        },
        {
          option: "300 adet + fiyat artışı",
          assessment: "Talep yavaşlar, stoksuz kalınmaz, satış adedi düşer.",
          risk: "low",
        },
      ],
      recommendation: stockRecommendation(),
    },
    {
      id: "dec-fx",
      question: "USD pozisyonunun %30'u kapatılsın mı?",
      date: today(),
      tier: "D3",
      status: "open",
      domain: "trading",
      alternatives: [
        {
          option: "%30 kapat",
          assessment: "İthalat maliyeti öngörülebilir olur; yukarı potansiyel sınırlanır.",
          risk: "low",
        },
        {
          option: "Pozisyonu koru",
          assessment: "Yukarı potansiyel korunur, kur riski sürer.",
          risk: "high",
        },
      ],
      recommendation: {
        id: "rec-fx",
        recommendation: "USD pozisyonunun %30'unu kapat, kalanı 2 hafta izle.",
        confidence: 38.2,
        confidenceBreakdown: {
          knowledge_coverage: 45,
          evidence_strength: 40,
          expert_agreement: 50,
          model_agreement: 45,
          historical_success: 35,
          risk_level: 75,
          missing_information: 60,
          decision_complexity: 65,
        },
        evidence: [evidence()[2]!],
        potentialRisks: ["Kur düşerse kapanan pozisyonun fırsat maliyeti doğar"],
        assumptions: ["Oynaklık bandı en az 2 hafta açık kalır"],
        flipConditions: ["USD/TRY 72 saat içinde banda geri dönerse karar iptal"],
        consensusScore: 62,
        disagreementScore: 38,
        minorityOpinions: [
          "finance: kapatma — nakit planı kur sabitlemesine ihtiyaç duymuyor",
        ],
        recClass: "C",
        responsibleDirector: "Trading AI",
        lastValidated: ago(6 * 60 * 60_000),
      },
    },
    {
      id: "dec-listing",
      question: "3 SKU'nun başlık ve bullet'ları güncellensin mi?",
      date: today(),
      tier: "D1",
      status: "monitoring",
      domain: "amazon",
      alternatives: [
        {
          option: "Üç SKU'yu birlikte güncelle",
          assessment: "Tek seferde yayına alınır; etki 3 haftada ölçülür.",
          risk: "low",
        },
        {
          option: "Önce tek SKU ile A/B testi",
          assessment: "Daha yavaş ama ölçülebilir.",
          risk: "low",
        },
      ],
      recommendation: {
        id: "rec-listing",
        recommendation: "Önce tek SKU ile A/B testi yap, sonucu 3 hafta ölç.",
        confidence: 74.1,
        confidenceBreakdown: {
          knowledge_coverage: 75,
          evidence_strength: 70,
          expert_agreement: 85,
          model_agreement: 75,
          historical_success: 70,
          risk_level: 20,
          missing_information: 35,
          decision_complexity: 25,
        },
        evidence: evidence().slice(0, 1),
        potentialRisks: ["Test süresince organik trafik artışı gecikir"],
        assumptions: ["Anahtar kelime hacmi test süresince stabil kalır"],
        flipConditions: ["Test SKU'sunda CTR 2 haftada %10 artmazsa toplu güncelleme iptal"],
        consensusScore: 88,
        disagreementScore: 12,
        minorityOpinions: [],
        recClass: "A",
        responsibleDirector: "Amazon AI",
        lastValidated: ago(2 * 60 * 60_000),
      },
      humanDecision: {
        outcome: "approved",
        humanReasoning: "Düşük risk; A/B ölçümü toplu değişiklikten öğretici.",
      },
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

/* ADR-0143 §1 kanonik Alert zarfı — id/severity/title/module/
   requires_action/evidence/created_at/suggested_action. Zarfta olmayan
   alan mock'ta da yoktur. */
export function risksMock(): DataEnvelope<Alert[]> {
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
      id: "AL-margin-2026-07",
      severity: "warning",
      title: "Net kâr marjı %4 daraldı",
      module: "finance",
      requiresAction: true,
      evidence: ["KO-finance-quality-2026-07"],
      createdAt: ago(90 * 60_000),
    },
    /* requiresAction:false → listeye GİRMEZ, elendiği altta yazılır.
       ADR-0143 §1 bu kuralı üretici tarafına da yazdı. */
    {
      id: "AL-spapi-sync-done",
      severity: "info",
      title: "Günlük senkronizasyon tamamlandı",
      module: "system",
      requiresAction: false,
      evidence: [],
      createdAt: ago(30 * 60_000),
    },
  ] satisfies Alert[]);
}

/*
 * Fırsatlar AYRI KAYIT DEĞİLDİR (ADR-0143 §3): öneri kayıtlarının pozitif
 * sınıfıdır. Bu yüzden mock da `AIRecommendation` döndürür — uydurma bir
 * Opportunity tipi yok. Pozitif sınıfı hangi kayıtlı alanın işaretlediği
 * ODIN'de henüz bildirilmedi (13-...md §17); mock bu yüzden filtre
 * UYGULAMAZ, ekran neyi filtrelemediğini söyler.
 */
export function opportunitiesMock(): DataEnvelope<AIRecommendation[]> {
  return mockEnvelope([ppcRecommendation()]);
}

/* --------------------------------------------------------------------------
   Executive KPI'lar — 05-dashboard.md §3.5 (dokümandaki 9 kalem, aynı sırada)
   -------------------------------------------------------------------------- */

/* ADR-0143 §2: sınır zarfı DÜZDÜR (status/value/unit/currency/scale/
   reason/as_of). Sparkline · forecast · insight sözleşmenin PARÇASI DEĞİL,
   bu yüzden mock'ta da yok — anti-fake mock'ta da geçerlidir. */
function kpi(
  over: Partial<ExecutiveKPI> & Pick<ExecutiveKPI, "id" | "label" | "unit">
): ExecutiveKPI {
  return { status: "available", value: null, asOf: ago(30 * 60_000), ...over };
}

export function kpisMock(): DataEnvelope<ExecutiveKPI[]> {
  return mockEnvelope([
    kpi({
      id: "company.revenue",
      label: "Revenue",
      value: 4_182_000,
      unit: "currency",
      currency: "TRY",
    }),
    kpi({
      id: "company.net_profit",
      label: "Net Profit",
      value: 1_284_000,
      unit: "currency",
      currency: "TRY",
    }),
    kpi({
      id: "company.cash_flow",
      label: "Cash Flow",
      value: 862_000,
      unit: "currency",
      currency: "TRY",
    }),
    kpi({
      id: "amazon.health_score",
      label: "Amazon",
      value: 78,
      unit: "score",
    }),
    kpi({
      id: "amazon.inventory_health",
      label: "Inventory",
      value: 63.4,
      unit: "percent",
      /* UI-ADR-093 — ölçek BİLDİRİLİR. Bu alan olmasaydı kart boş görünürdü. */
      scale: "0-100",
    }),
    kpi({
      id: "council.ai_confidence",
      label: "AI Confidence",
      value: 88,
      unit: "score",
    }),
    /* --- Ölçüm kaynağı olmayan iki KPI: değer UYDURULMAZ. ---
       telemetry registry'de `knowledge_sync` ve `memory_indexing` kanalları
       `available: false`. Kart çizilir; zarf durumu ve GEREKÇESİ gelir,
       sayı alanı null kalır (ADR-0135 sınırı). */
    kpi({
      id: "knowledge.health",
      label: "Knowledge Health",
      status: "unavailable",
      value: null,
      reason: "knowledge_sync telemetri kanalı kapalı; skor üretilmiyor.",
      unit: "score",
    }),
    kpi({
      id: "memory.health",
      label: "Memory Health",
      status: "unavailable",
      value: null,
      reason: "memory_indexing telemetri kanalı kapalı; skor üretilmiyor.",
      unit: "score",
    }),
    kpi({
      id: "executive.decision_confidence",
      label: "Decision Confidence",
      value: 81,
      unit: "score",
    }),
  ]);
}

/* --------------------------------------------------------------------------
   Director aktivitesi — UI-ADR-074 ile DONDURULMUŞ 6 Director
   -------------------------------------------------------------------------- */

export function directorsMock(): DataEnvelope<AgentHealth[]> {
  /* Alanlar ODIN AgentHealthMonitor.snapshot() ile birebir (09b §5).
     Ölçülmemiş metrik null gelir ve kartta NoData çıkar — mock'ta da
     uydurma yok: availability hiçbir ajanda hesaplanmıyorsa null'dur. */
  const base = {
    consecutiveFailures: 0,
    lastFailure: null as string | null,
    checkedAt: ago(30_000),
  };

  return mockEnvelope([
    {
      ...base,
      agentId: "executive",
      name: "Executive AI",
      verdict: "healthy",
      lastSuccess: ago(2 * 60_000),
      metrics: {
        latencyMsAvg: 1840, latencyMsP95: 4100, successRate: 0.98,
        errorRate: 0.02, tokensUsed: 184_000, costUsd: 1.42,
        queueLength: 1, availability: null, lastHeartbeat: ago(2_000),
      },
    },
    {
      ...base,
      agentId: "amazon",
      name: "Amazon AI",
      verdict: "healthy",
      lastSuccess: ago(4 * 60_000),
      metrics: {
        latencyMsAvg: 2210, latencyMsP95: 5600, successRate: 0.96,
        errorRate: 0.04, tokensUsed: 512_000, costUsd: 3.87,
        queueLength: 3, availability: null, lastHeartbeat: ago(3_000),
      },
    },
    {
      ...base,
      agentId: "finance",
      name: "Finance AI",
      verdict: "healthy",
      lastSuccess: ago(11 * 60_000),
      metrics: {
        latencyMsAvg: 1520, latencyMsP95: 3900, successRate: 0.99,
        errorRate: 0.01, tokensUsed: 96_000, costUsd: 0.74,
        queueLength: 0, availability: null, lastHeartbeat: ago(4_000),
      },
    },
    {
      ...base,
      agentId: "trading",
      name: "Trading AI",
      /* Ardışık hatalar verdict'i ODIN tarafında unhealthy'ye düşürdü —
         UI eşik TÜRETMEDİ, kaydı gösteriyor (UI-ADR-111). */
      verdict: "unhealthy",
      consecutiveFailures: 3,
      lastSuccess: ago(90 * 60_000),
      lastFailure: ago(6 * 60_000),
      metrics: {
        latencyMsAvg: 8900, latencyMsP95: 21_000, successRate: 0.71,
        errorRate: 0.29, tokensUsed: 44_000, costUsd: 0.51,
        queueLength: 2, availability: null, lastHeartbeat: ago(90_000),
      },
    },
    {
      ...base,
      agentId: "knowledge",
      name: "Knowledge AI",
      /* Hiç gözlem yok → ODIN "unknown" der; bilmemek ölmüş olmak değildir. */
      verdict: "unknown",
      lastSuccess: null,
      metrics: {
        latencyMsAvg: null, latencyMsP95: null, successRate: null,
        errorRate: null, tokensUsed: 0, costUsd: null,
        queueLength: 0, availability: null, lastHeartbeat: null,
      },
      checkedAt: null,
    },
    {
      ...base,
      agentId: "reasoning",
      name: "Reasoning AI",
      verdict: "healthy",
      lastSuccess: ago(60_000),
      metrics: {
        latencyMsAvg: 3100, latencyMsP95: 7400, successRate: 0.97,
        errorRate: 0.03, tokensUsed: 238_000, costUsd: 2.05,
        queueLength: 1, availability: null, lastHeartbeat: ago(1_500),
      },
    },
  ] satisfies AgentHealth[]);
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

/**
 * Runtime direktörleri — ODIN ADR-0148 (UI-ADR-127).
 *
 * `AgentHealth` mock'undan AYRI, çünkü kavram ayrı: bunlar zamanlanmış
 * runtime işleridir, görev-kuyruğu ajanları değil. Dördü de dört durumu
 * kapsar — `stale` ile `failed`'in ekranda AYRI göründüğü Storybook'ta
 * doğrulanabilsin diye.
 */
export function runtimeDirectorsMock(): DataEnvelope<RuntimeDirector[]> {
  const now = Date.now();
  const at = (msAgo: number) => new Date(now - msAgo).toISOString();
  return mockEnvelope([
    {
      id: "watcher-agent",
      status: "healthy" as const,
      lastBeat: at(20_000),
      beatIntervalMs: 60_000,
      failuresTotal: 0,
      lastError: null,
      jobs: [{ id: "drain", status: "healthy" as const, lastBeat: at(20_000),
               cadence: "1dk", lastError: null }],
    },
    {
      id: "data-director",
      status: "stale" as const,
      lastBeat: at(4 * 3_600_000),
      beatIntervalMs: 3_600_000,
      failuresTotal: 1,
      lastError: null,
      jobs: [{ id: "amazon_ingest", status: "stale" as const,
               lastBeat: at(4 * 3_600_000), cadence: "saatlik", lastError: null }],
    },
    {
      id: "curator-agent",
      status: "failed" as const,
      lastBeat: at(90_000),
      beatIntervalMs: 86_400_000,
      failuresTotal: 3,
      lastError: "RuntimeError",
      jobs: [{ id: "creator_curator", status: "failed" as const,
               lastBeat: at(90_000), cadence: "gunluk",
               lastError: "RuntimeError" }],
    },
    {
      id: "acie-agent",
      /* Hiç koşmamış bir iş `unknown`dır, `healthy` DEĞİL — ADR-0148 §5. */
      status: "unknown" as const,
      lastBeat: null,
      /* Cadence bilinmiyorsa `null`; tahmin edilmez. */
      beatIntervalMs: null,
      failuresTotal: 0,
      lastError: null,
      jobs: [{ id: "acie", status: "unknown" as const, lastBeat: null,
               cadence: null, lastError: null }],
    },
  ]);
}
