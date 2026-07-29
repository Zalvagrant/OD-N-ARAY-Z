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

/**
 * FR-0046 v1 minimal KPI — gerçekçi varsayılan hâl: FR-0043 katmanları
 * (trend · sparkline · yorum · forecast · risk) ODIN'de üretilmediği için
 * YOK; kart bunları NoData ile söyler.
 */
export const kpi: ExecutiveKPI = {
  id: "company.net_profit",
  metricKey: "net_profit",
  label: "Net Profit",
  value: { status: "available", value: 1_284_000 },
  unit: "currency",
  currencyCode: "TRY",
  asOf: ago(30 * 60_000),
  source: "briefing",
};

/**
 * FR-0043 katmanları DOLU varyant — bileşenin opsiyonel render yollarını
 * (trend satırı · sparkline · Level 2/3) çalıştırmak İÇİNDİR. Bu bir story
 * aracıdır; ürün mock'larına giremez (kaynak yok, anti-fake).
 */
export const kpiFr0043: ExecutiveKPI = {
  ...kpi,
  id: "amazon.acos",
  metricKey: "acos",
  label: "ACOS",
  value: { status: "available", value: 18.1 },
  unit: "percent",
  scale: "0-100",
  currencyCode: undefined,
  source: "amazon_director",
  trend: { direction: "up", changePercent: 12, comparedTo: "geçen hafta" },
  sparkline: [14.2, 14.8, 15.6, 16.4, 17.2, 17.8, 18.1],
  aiInsight: "Artışın tamamı Kampanya B'den; diğer kampanyalar hedef bandında.",
  confidence: 94,
  forecast: { value: 15.2, horizon: "14 gün", confidence: 71 },
  risk: "high",
  recommendedAction: recommendation,
  evidence,
  owner: "Amazon AI",
};

/** Zarf `status !== "available"` — sayı yerine GEREKÇELİ NoData (ADR-0135). */
export const kpiVeriGerekli: ExecutiveKPI = {
  id: "amazon.net_profit",
  metricKey: "net_profit",
  label: "Net Profit",
  value: {
    status: "unavailable",
    value: null,
    reason: "COGS girilmeden net kâr hesaplanamaz.",
  },
  unit: "currency",
  currencyCode: "USD",
  asOf: ago(30 * 60_000),
  source: "amazon_director",
};

/** Tek alternatifli öneri taşıyan varyant — öneri bölümü RENDER EDİLMEZ. */
export const kpiEksik: ExecutiveKPI = {
  ...kpiFr0043,
  id: "knowledge.health",
  metricKey: "knowledge_health",
  label: "Knowledge Health",
  unit: "score",
  value: { status: "available", value: 72 },
  scale: undefined,
  aiInsight: undefined,
  confidence: undefined,
  forecast: undefined,
  risk: undefined,
  sparkline: [70],
  recommendedAction: recommendationTekAlternatif,
  evidence: [],
  owner: undefined,
};

/**
 * Kanonik `DecisionRecord` fikstürü — UI-ADR-105.
 * Eski fikstür 13 uydurulmuş alan taşıyordu; ODIN'de karşılığı olmayan
 * hiçbir alan artık burada yok.
 */
export const decision: Decision = {
  id: "dec-1",
  date: "2026-07-29T06:00:00.000Z",
  question: "Amazon PPC bütçesini %7 artırmalı mıyız?",
  tier: "D2",
  domain: "amazon",
  status: "open",
  humanDecision: null,
  reason:
    "Gösterim payı iki haftadır düşüyor. Kademeli bütçe artışı kârı korurken satış kaybını durduruyor.",
  alternatives: recommendation.alternatives,
  recommendation: {
    text: "PPC bütçesini %7 artır, 7 gün sonra tekrar değerlendir.",
    confidence: 96,
    confidenceBreakdown: [
      { key: "knowledge_coverage", label: "Bilgi kapsamı", score: 82, weight: 20, direction: "positive" },
      { key: "evidence_strength", label: "Kanıt gücü", score: 88, weight: 20, direction: "positive" },
      { key: "expert_agreement", label: "Uzman uzlaşması", score: 74, weight: 15, direction: "positive" },
      { key: "risk_level", label: "Risk seviyesi", score: 45, weight: 10, direction: "negative" },
    ],
    evidenceSnapshot: evidence,
    risks: ["Kur artarsa birim maliyet yükselir"],
    assumptions: ["Dönüşüm oranı son 14 günün ortalamasında kalır"],
    consensusScore: 91,
    disagreementScore: 9,
    minorityOpinions: [
      {
        member: "Trading AI",
        option: "Bütçeyi sabit tut",
        rationale: "USD riski nedeniyle 48 saat beklenmesini öneriyorum.",
      },
    ],
    flipConditions: ["Gösterim payı kendiliğinden %28'in üzerine dönerse"],
  },
  financialImpact: { amount: 82000, currency: "TRY", horizon: "30 gün" },
  riskLevel: "medium",
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

/* FR-0046 v1 Alert: source üretici kimliğidir; severity'siz kayıt rozetsiz
   ve bilinenlerden sonra listelenir; requiresAction:false listeye girmez. */
export const alerts: Alert[] = [
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
  /* severity ATLANDI — belgelenmiş eşleme yok; uydurulmaz. */
  {
    id: "improvement_detectors.listing_error.sku-3310",
    source: "improvement_detectors",
    title: "Listeleme hatası — SKU-3310",
    summary: "Görsel çözünürlüğü Amazon eşiğinin altında.",
    requiresAction: true,
    asOf: ago(26 * 60 * 60_000),
  },
  {
    id: "amazon_director.spapi_sync.done",
    source: "amazon_director",
    severity: "low",
    title: "Günlük senkronizasyon tamamlandı",
    summary: "Bilgi amaçlı — aksiyon gerektirmez, listeye girmemeli.",
    requiresAction: false,
    asOf: ago(30 * 60_000),
  },
];

/* FR-0046 v1 Opportunity: suggestedAction zorunlu düz metin; parasal etki
   alanı v1'de YOK (kaynağı kanıtlanmadı). */
export const opportunity: Opportunity = {
  id: "amazon_director.keyword.rising-term",
  source: "amazon_director",
  title: "Yükselen anahtar kelimeye bütçe kaydır",
  summary: "Terim 14 günde gösterim payı kazandı; mevcut kampanyalar zayıf konumda.",
  suggestedAction: "Terimi kazanan kampanyaya exact match olarak ekle, 7 gün CPC izle.",
  evidence: ["keyword:katlanır kamp sandalyesi", "metric:impression_share"],
  asOf: ago(55 * 60_000),
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
