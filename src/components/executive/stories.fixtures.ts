/**
 * SADECE STORYBOOK İÇİN örnek veri.
 *
 * ⚠️ UYGULAMA KODUNDAN İMPORT EDİLMEZ. Buradaki değerler gerçek ölçüm
 * değildir; amacı bileşenlerin dolu ve BOŞ hâllerini yan yana gösterebilmektir.
 * Anti-fake kuralı "ekranda gerçek veri" der — Storybook ekran değil, kataloğdur.
 */

import type {
  AIRecommendation,
  Alert,
  Decision,
  AgentHealth,
  EvidenceRef,
  ExecutiveBrief,
  ExecutiveKPI,
  Opportunity,
  PulseChannelStates,
  TelemetryValues,
} from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";

export const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

export function meta(over: Partial<DataMeta> = {}): DataMeta {
  return {
    source: "ai",
    lastUpdated: ago(2 * 60_000),
    freshness: "live",
    confidence: 94,
    ...over,
  };
}

export function envelope<T>(data: T, over: Partial<DataMeta> = {}): DataEnvelope<T> {
  return { data, meta: meta(over) };
}

export const evidence: EvidenceRef[] = [
  {
    id: "ev-1",
    type: "metric",
    title: "ACOS son 14 gün",
    excerpt: "ACOS %18,1'e yükseldi; harcama sabit, satış düştü.",
    sourceQuality: 92,
    freshness: ago(30 * 60_000),
    supportsOrContradicts: "supports",
  },
  {
    id: "ev-2",
    type: "decision",
    title: "2026-05 bütçe artışı kararı",
    excerpt: "Benzer koşulda %7 artış kârı korumuştu.",
    sourceQuality: 78,
    freshness: ago(60 * 24 * 60 * 60_000),
    supportsOrContradicts: "supports",
  },
  {
    id: "ev-3",
    type: "external",
    title: "USD/TRY 72 saatlik görünüm",
    excerpt: "Kur yukarı yönlü; ithalat maliyeti artabilir.",
    sourceQuality: 64,
    freshness: ago(3 * 60 * 60_000),
    supportsOrContradicts: "contradicts",
  },
];

export const recommendation: AIRecommendation = {
  id: "rec-1",
  recommendation: "Amazon PPC bütçesini %7 artır, 7 gün sonra tekrar değerlendir.",
  confidence: 71.4,
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
  evidence,
  potentialRisks: ["Kur artarsa birim maliyet yükselir", "Nakit akışı bir hafta sıkışabilir"],
  assumptions: ["Rakip teklif seviyesi mevcut bandında kalır"],
  flipConditions: ["ACOS 7 gün içinde %20'yi aşarsa artış geri alınır"],
  consensusScore: 66.7,
  disagreementScore: 33.3,
  minorityOpinions: ["trading: beklet — USD riski nedeniyle 48 saat beklenmeli"],
  recClass: "B",
  numbers: { ACOS: 18.1, TACOS: 9.4, "Harcama (USD)": 2420, "Satış (USD)": 18300 },
  causeAnalysis: "Rakip teklifleri yükseldi, gösterim payı düştü.",
  impactAnalysis: "Mevcut tempoda aylık net kârda ~₺46.000 kayıp riski var.",
  expectedFinancialResult: { amount: 82000, currency: "TRY" },
  whyGenerated: "ACOS 14 gündür yükseliyor ve gösterim payı eşiğin altına indi.",
  responsibleDirector: "Amazon AI",
  relatedKnowledge: ["PPC oynaklık politikası", "2026-05 bütçe kararı"],
  lastValidated: ago(15 * 60_000),
};

/** Kural ihlali örneği: flip_conditions EKSİK → bileşen RENDER ETMEZ.
    (Eski örnek "tek alternatif"ti; alternatifler artık kararın alanı —
    UI-ADR-100. ODIN'in zorunlu kıldığı bir alanın eksikliği aynı davranışı
    tetikler.) */
export const recommendationEksikAlan: AIRecommendation = {
  ...recommendation,
  id: "rec-2",
  flipConditions: [],
};

export const kpi: ExecutiveKPI = {
  id: "kpi-net-profit",
  label: "Net Profit",
  value: 1_284_000,
  unit: "currency",
  currency: "TRY",
  trend: { direction: "up", changePercent: 12, comparedTo: "önceki ay" },
  sparkline: [980, 1020, 1005, 1120, 1180, 1210, 1284],
  aiInsight: "Artış büyük ölçüde reklam verimliliğinden geliyor, hacimden değil.",
  confidence: 94,
  forecast: { value: 1_400_000, horizon: "30 gün", confidence: 81 },
  risk: "low",
  recommendedAction: recommendation,
  evidence,
  owner: "Finance AI",
};

/** Ölçülemeyen alanlar: confidence, forecast, AI yorumu yok. */
export const kpiEksik: ExecutiveKPI = {
  ...kpi,
  id: "kpi-eksik",
  label: "Knowledge Health",
  unit: "score",
  value: 72,
  currency: undefined,
  aiInsight: "",
  confidence: Number.NaN,
  forecast: { value: Number.NaN, horizon: "", confidence: Number.NaN },
  sparkline: [70],
  recommendedAction: recommendationEksikAlan,
  evidence: [],
  owner: "",
};

export const decision: Decision = {
  id: "dec-1",
  question: "Amazon PPC bütçesi %7 artırılsın mı?",
  date: "2026-07-30",
  tier: "D2",
  status: "open",
  domain: "amazon",
  /* KARARIN alanı — şema minItems 2 (UI-ADR-100). */
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
  recommendation,
  expectedOutcome: "Gösterim payı 2 hafta içinde %28 üzerine döner",
};

/** Verdict verilmiş karar — eylem butonları ÇİZİLMEZ, kayıt görünür. */
export const decisionKapanmis: Decision = {
  ...decision,
  id: "dec-2",
  status: "closed",
  humanDecision: {
    outcome: "approved",
    humanReasoning: "Kanıt yeterli; kur riski flip koşuluyla sınırlandı.",
  },
};

export const director: AgentHealth = {
  agentId: "amazon",
  name: "Amazon Director",
  verdict: "healthy",
  consecutiveFailures: 0,
  lastSuccess: ago(4 * 60_000),
  lastFailure: null,
  metrics: {
    latencyMsAvg: 2210, latencyMsP95: 5600, successRate: 0.96,
    errorRate: 0.04, tokensUsed: 512_000, costUsd: 3.87,
    queueLength: 3, availability: null, lastHeartbeat: ago(2_000),
  },
  checkedAt: ago(30_000),
};

/** ODIN'in unhealthy dediği ajan — UI eşik türetmedi, kaydı gösteriyor. */
export const directorUnhealthy: AgentHealth = {
  ...director,
  agentId: "trading",
  name: "Trading Director",
  verdict: "unhealthy",
  consecutiveFailures: 3,
  lastFailure: ago(6 * 60_000),
  metrics: { ...director.metrics, successRate: 0.71, errorRate: 0.29,
             lastHeartbeat: ago(90_000) },
};

/** Hiç gözlem yok → unknown. Bilmemek ölmüş olmak değildir. */
export const directorUnknown: AgentHealth = {
  agentId: "legal",
  name: "Legal Director",
  verdict: "unknown",
  consecutiveFailures: 0,
  lastSuccess: null,
  lastFailure: null,
  metrics: {
    latencyMsAvg: null, latencyMsP95: null, successRate: null,
    errorRate: null, tokensUsed: 0, costUsd: null,
    queueLength: 0, availability: null, lastHeartbeat: null,
  },
  checkedAt: null,
};

export const alerts: Alert[] = [
  {
    id: "al-1",
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
    id: "al-2",
    severity: "risk",
    title: "Stok tükenme riski — SKU-1042",
    description: "Tahmini tükenme 9 gün. Tedarik süresi 21 gün.",
    module: "amazon",
    affectedEntities: ["SKU-1042"],
    responsibleDirector: "Amazon AI",
    requiresAction: true,
    createdAt: ago(3 * 60 * 60_000),
  },
  {
    id: "al-3",
    severity: "info",
    title: "Günlük senkronizasyon tamamlandı",
    description: "Bilgi amaçlı — aksiyon gerektirmez, listeye girmemeli.",
    module: "system",
    affectedEntities: [],
    responsibleDirector: "System",
    requiresAction: false,
    createdAt: ago(30 * 60_000),
  },
];

export const opportunity: Opportunity = {
  id: "opp-1",
  title: "Yükselen anahtar kelimeye bütçe kaydır",
  category: "keyword",
  revenueImpact: { amount: 64000, currency: "TRY" },
  confidence: 83,
  deadline: ago(-7 * 24 * 60 * 60_000),
  recommendedAction: recommendation,
  evidence,
};

export const brief: ExecutiveBrief = {
  numbers: { "Health Score": 94, Revenue: 1284000, ACOS: 18.1, Orders: 412 },
  analysis: "ACOS artışı gösterim payı kaybından geliyor; harcama sabit kaldı.",
  interpretation:
    "Sorun bütçe değil, teklif seviyesidir. Mevcut tempoda aylık kâr ~%4 aşınır.",
  recommendation,
  evidence,
};

export const pulse: PulseChannelStates = {
  processing: { active: true, load: 72, lastActivity: ago(5_000), available: true },
  memory_knowledge: { active: true, load: 31, lastActivity: ago(20_000), available: true },
  prediction: { active: false, load: 0, lastActivity: ago(15 * 60_000), available: true },
  /* Kapalı kanallar — çizilmemeli. */
  reasoning: { active: true, load: 99, lastActivity: ago(1_000), available: false },
  reflection: { active: true, load: 88, lastActivity: ago(1_000), available: false },
};

export const telemetry: TelemetryValues = {
  last_sync: ago(4 * 60_000),
  api_traffic: 128,
  background_jobs: 6,
  /* error_count bilerek yok → "0" yazılmamalı, NoData çıkmalı. */
};
