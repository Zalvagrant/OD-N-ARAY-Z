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
  DirectorHeartbeat,
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
  numbers: { ACOS: 18.1, TACOS: 9.4, "Harcama (USD)": 2420, "Satış (USD)": 18300 },
  causeAnalysis: "Rakip teklifleri yükseldi, gösterim payı düştü.",
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
  expectedFinancialResult: { amount: 82000, currency: "TRY" },
  confidence: 96,
  evidence,
  whyGenerated: "ACOS 14 gündür yükseliyor ve gösterim payı eşiğin altına indi.",
  responsibleDirector: "Amazon AI",
  relatedKnowledge: ["PPC oynaklık politikası", "2026-05 bütçe kararı"],
  lastValidated: ago(15 * 60_000),
  potentialRisks: ["Kur artarsa birim maliyet yükselir", "Nakit akışı bir hafta sıkışabilir"],
};

/** Kural ihlali örneği: tek alternatif → bileşen RENDER ETMEZ. */
export const recommendationTekAlternatif: AIRecommendation = {
  ...recommendation,
  id: "rec-2",
  alternatives: [recommendation.alternatives[0]!],
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
  recommendedAction: recommendationTekAlternatif,
  evidence: [],
  owner: "",
};

export const decision: Decision = {
  id: "dec-1",
  type: "amazon",
  title: "Amazon PPC bütçesini %7 artır",
  executiveSummary:
    "Gösterim payı iki haftadır düşüyor. Kademeli bütçe artışı kârı korurken satış kaybını durduruyor.",
  priority: 1,
  status: "under_review",
  strategicImpact: "medium",
  financialImpact: { amount: 82000, currency: "TRY", horizon: "30 gün" },
  riskLevel: "medium",
  aiConfidence: 96,
  evidenceQuality: 97,
  reversibility: "reversible",
  executionComplexity: "low",
  expectedROI: 2.4,
  directorOpinions: [
    {
      directorId: "Amazon AI",
      position: "support",
      argument: "PPC artırılmalı; gösterim payı kaybı satış kaybına dönüştü.",
      confidence: 94,
      evidence: [evidence[0]!],
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
      evidence: [evidence[2]!],
    },
  ],
  consensus: 91,
  disagreement: 9,
  minorityOpinion: {
    directorId: "Trading AI",
    position: "oppose",
    argument: "USD riski nedeniyle 48 saat beklenmesini öneriyorum.",
    confidence: 68,
    evidence: [evidence[2]!],
  },
  alternatives: recommendation.alternatives,
  evidence,
  relatedDecisions: [],
  timeline: [],
  recommendation,
};

export const director: DirectorHeartbeat = {
  directorId: "amazon",
  name: "Amazon Director",
  status: "analyzing",
  currentGoal: "ACOS'u %16 altına indir",
  currentTask: "Kampanya B teklif eğrisi yeniden hesaplanıyor",
  confidence: 97,
  taskCount: 24,
  queueLength: 3,
  evidenceCount: 182,
  recommendationCount: 4,
  memoryHealth: "healthy",
  predictionStatus: "running",
  lastBeat: ago(2_000),
  beatIntervalMs: 5_000,
};

/** lastBeat 3 aralıktan eski → kart offline'a düşer, nabız durur. */
export const directorOffline: DirectorHeartbeat = {
  ...director,
  directorId: "trading",
  name: "Trading Director",
  lastBeat: ago(60_000),
};

/** lastBeat hiç yok → "offline" DEĞİL, bilinmiyor. */
export const directorAtimYok: DirectorHeartbeat = {
  ...director,
  directorId: "legal",
  name: "Legal Director",
  status: "idle",
  currentGoal: null,
  currentTask: null,
  confidence: null,
  lastBeat: null,
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
