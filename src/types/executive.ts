/**
 * ODIN Executive Data Contracts
 * Kaynak: docs/ui_chatgpt/09-data-contracts.md §1–§13
 *
 * Bu dosya sözleşmenin BİREBİR TypeScript karşılığıdır. Yeni alan icat
 * edilmez; sözleşmede olmayan bir ihtiyaç doğarsa
 * `13-backend-recommendations.md`'ye not düşülür (CLAUDE.md §7).
 *
 * TEK SAPMA (gerekçeli, 13-...md §12'ye işlendi):
 *   Decision.recommendation — 05-dashboard.md §3.2 karar kartında
 *   "Recommendation" satırı istiyor, 09-...md §2 sözleşmesinde bu alan yok.
 *   Opsiyonel bırakıldı: gelirse gösterilir, gelmezse satır hiç çizilmez.
 *   Uydurma yapılmaz.
 *
 * YÜZDE ÖLÇEĞİ — UI-ADR-093: varsayım YOK. `unit: "percent"` ise `scale`
 * alanı ZORUNLUDUR. Gelmezse değer gösterilmez (NoData). 18.1 mi 0.181 mi
 * sorusunu tahmin etmek 100 kat yanlış gösterim riskidir.
 * İstisna: `trend.changePercent` — 05-dashboard.md §4 anatomisi bu alanı
 * `12 → "▲ %12"` örneğiyle açıkça 0–100 olarak dondurmuştur.
 */

export interface Money {
  amount: number;
  currency: string;
}

export interface Alternative {
  title: string;
  description: string;
  expectedOutcome: string;
  risk: "low" | "medium" | "high";
}

export interface EvidenceRef {
  id: string;
  type: "document" | "metric" | "decision" | "external" | "conversation";
  title: string;
  excerpt?: string;
  sourceUrl?: string;
  /** 0–100 */
  sourceQuality: number;
  /** ISO 8601 */
  freshness: string;
  supportsOrContradicts: "supports" | "contradicts" | "neutral";
}

export interface DirectorOpinion {
  directorId: string;
  position: "support" | "oppose" | "neutral";
  argument: string;
  confidence: number;
  evidence: EvidenceRef[];
}

/* --------------------------------------------------------------------------
   §3 AIRecommendation — 7 alanlı explainability sözleşmesi
   -------------------------------------------------------------------------- */

export interface AIRecommendation {
  id: string;
  recommendation: string;

  numbers: Record<string, number | string>;
  causeAnalysis: string;
  impactAnalysis: string;
  /** En az 2 — zorunlu (07-...md §7). Altındaysa öneri RENDER EDİLMEZ. */
  alternatives: Alternative[];
  expectedFinancialResult: { amount?: number; percent?: number; currency?: string };
  confidence: number;
  evidence: EvidenceRef[];

  /* Explainability zorunlulukları — biri eksikse öneri gösterilmez */
  whyGenerated: string;
  responsibleDirector: string;
  relatedKnowledge: string[];
  /** ISO 8601 */
  lastValidated: string;
  potentialRisks: string[];
}

/* --------------------------------------------------------------------------
   ExecutiveKPI — FR-0046 v1 kanonik sözleşme (UI-ADR-106)
   Meclis sentezi (gavadolar + sistemciler), sahip onayı 2026-07-30.
   ODIN kayıt defteri (R-006 FR-0046) kapanışı bekleniyor — 13-...md §17.
   -------------------------------------------------------------------------- */

/** Yüzde değerinin hangi aralıkta geldiği. Tahmin edilmez, bildirilir. */
export type PercentScale = "0-1" | "0-100";

/** FR-0044 değer zarfı — sözleşmenin PARÇASIDIR, yalnız API sınırında değil. */
export type MetricStatus = "available" | "data_required" | "unavailable";

export interface MetricValue {
  status: MetricStatus;
  /**
   * `status === "available"` ise sayı, değilse null. "Data Required" gibi
   * sunum METNİ bu alana asla girmez (ADR-0135): string bir sayı alanında
   * `typeof`/`toFixed` kırar ve truthy okunur.
   */
  value: number | null;
  /** `status !== "available"` ise ZORUNLU — neden ölçülemediği de bilgidir. */
  reason?: string;
}

export interface ExecutiveKPI {
  /** Kararlı, namespaced kimlik — ör. `"amazon.gross_profit"`. */
  id: string;
  /** Kanonik ODIN metrik anahtarı — ör. `"gross_profit"`. */
  metricKey: string;
  label: string;
  value: MetricValue;
  unit: "currency" | "percent" | "count" | "score";
  /** `unit === "currency"` ise ZORUNLU — ISO kodu (Amazon: USD, UI-ADR-103). */
  currencyCode?: string;
  /** `unit === "percent"` ise ZORUNLU. Yoksa değer render edilmez (UI-ADR-093). */
  scale?: PercentScale;
  /** ISO 8601 — metriğin veri anı. Zarfın `lastUpdated`'ından bağımsızdır. */
  asOf: string;
  /** Üretici — ör. `"amazon_director"`. */
  source: string;

  /*
   * FR-0043 — kaynağı OLMAYAN katmanlar. ODIN retained time series tutmuyor;
   * bu alanlar üretilene kadar opsiyoneldir, MOCK DAHİ DOLDURMAZ ve ekran
   * NoData basar. Boş bir yorum paneli dürüsttür; üretilmiş olanı, anti-fake
   * kuralının önlediği hatanın ta kendisidir (R-006 FR-0043).
   *
   * Metrik KUTBU (higherIsBetter) BİLEREK yok — UI-ADR-102: kutup her
   * metricKey için ODIN'de tanımlanmadan eklenirse kalıcı null üretir
   * (UI-ADR-104 dersi). Kutup bilinmedikçe renk iddiası yapılmaz.
   */
  trend?: {
    direction: "up" | "down" | "flat";
    changePercent: number;
    comparedTo: string;
  };
  sparkline?: (number | null)[];
  aiInsight?: string;
  confidence?: number;
  forecast?: { value: number; horizon: string; confidence: number };
  risk?: "none" | "low" | "medium" | "high" | "critical";
  recommendedAction?: AIRecommendation;
  evidence?: EvidenceRef[];
  owner?: string;
}

/* --------------------------------------------------------------------------
   §2 Decision
   -------------------------------------------------------------------------- */

export type DecisionStatus =
  | "proposed" | "collecting_evidence" | "under_review"
  | "approved" | "rejected" | "deferred"
  | "executing" | "monitoring" | "completed";

export interface DecisionScore {
  outcomeSuccess: number;
  onTime: boolean;
  expectedROI: number;
  actualROI: number;
  riskManagement: number;
  evidenceQuality: number;
  aiPredictionAccuracy: number;
}

export interface DecisionEvent {
  id: string;
  at: string;
  title: string;
  description?: string;
}

export interface Decision {
  id: string;
  type: "finance" | "amazon" | "trading" | "strategy" | "operations";
  title: string;
  executiveSummary: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: DecisionStatus;

  strategicImpact: "low" | "medium" | "high";
  financialImpact: { amount: number; currency: string; horizon: string };
  riskLevel: "low" | "medium" | "high" | "critical";
  aiConfidence: number;
  evidenceQuality: number;
  reversibility: "reversible" | "partially" | "irreversible";
  executionComplexity: "low" | "medium" | "high";
  expectedROI: number;
  actualROI?: number;
  lessonsLearned?: string;

  directorOpinions: DirectorOpinion[];
  consensus: number;
  disagreement: number;
  minorityOpinion?: DirectorOpinion;

  /** En az 2 — backend bu kuralı ihlal eden Decision üretemez. */
  alternatives: Alternative[];
  evidence: EvidenceRef[];
  relatedDecisions: string[];
  timeline: DecisionEvent[];
  score?: DecisionScore;

  /** Sözleşme dışı, opsiyonel — dosya başlığındaki "TEK SAPMA" notuna bak. */
  recommendation?: AIRecommendation;
}

/* --------------------------------------------------------------------------
   §4 DirectorHeartbeat
   -------------------------------------------------------------------------- */

export type DirectorStatus =
  | "idle" | "monitoring" | "analyzing" | "reviewing"
  | "processing" | "discovering" | "error" | "offline";

export interface DirectorHeartbeat {
  directorId: string;
  name: string;
  status: DirectorStatus;

  currentGoal: string | null;
  currentTask: string | null;
  confidence: number | null;

  taskCount: number;
  queueLength: number;
  evidenceCount: number;
  recommendationCount: number;

  memoryHealth: "healthy" | "degraded" | "critical";
  predictionStatus: "running" | "idle" | "failed";

  /** ISO 8601 — yoksa canlılık BİLİNMİYOR sayılır, "offline" değil. */
  lastBeat: string | null;
  beatIntervalMs: number;
}

/* --------------------------------------------------------------------------
   Alert · Opportunity — FR-0046 v1 kanonik sözleşmeler (UI-ADR-106)
   ODIN'in parçalı üreticileri (improvement_detectors · finance/quality ·
   amazon_director · innovation) için ortak AD; yeni motor değil.
   -------------------------------------------------------------------------- */

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export interface Alert {
  /** Kararlı, üretici-namespaced kimlik. */
  id: string;
  /** Üretici — ör. `"finance_quality"`. */
  source: string;
  title: string;
  /**
   * false ise Alerts listesine GİRMEZ (06-...md §1.4). Üretici, aksiyon
   * gerekip gerekmediğini semantik olarak belirleyemiyorsa kaydı kanonik
   * Alert olarak YAYINLAMAZ — varsayılan true/false atanmaz.
   */
  requiresAction: boolean;
  /** ISO 8601. */
  asOf: string;
  /** Açıklama / kanıt özeti. */
  summary?: string;
  /**
   * Belgelenmiş deterministik eşlemesi olmayan üretici bu alanı ATLAR,
   * null yazmaz — dört üreticinin bugün ortak severity semantiği yok
   * (meclis sentezi: sahte ortak semantik üretilmez).
   */
  severity?: AlertSeverity;
}

export interface Opportunity {
  /** Kararlı, üretici-namespaced kimlik. */
  id: string;
  /** Üreten ODIN bileşeni. */
  source: string;
  title: string;
  /** Fırsatın gerekçesi. */
  summary: string;
  /**
   * Uygulanabilir öneri. Bunu sağlayamayan kayıt Opportunity DEĞİLDİR;
   * üreticiye özel çıktısında kalır (meclis kararı — §1.6'nın "eyleme dönük
   * feed" tanımının gereği).
   *
   * `estimatedImpact` v1'de BİLİNÇLİ OLARAK YOK: ortak ve güvenilir bir
   * parasal etki kaynağı kanıtlanmadı; kalıcı null alan sahte yetenektir
   * (UI-ADR-104). Kaynak+formül+belirsizlik tanımlanırsa FR-0044 zarfıyla
   * ayrı ADR'de eklenir.
   */
  suggestedAction: string;
  /** ISO 8601. */
  asOf: string;
  /** Kaynak anahtarları — ör. `"sku:SKU-1042"`, `"metric:acos"`. */
  evidence?: string[];
}

/* --------------------------------------------------------------------------
   §10 AIPulse · §12 Telemetry
   -------------------------------------------------------------------------- */

export interface ChannelState {
  active: boolean;
  /** 0–100 → halka hızını belirler */
  load: number;
  lastActivity: string;
  available: boolean;
}

/** Kanal id → durum. Registry'de available:true olmayan kanal ÇİZİLMEZ. */
export type PulseChannelStates = Record<string, ChannelState>;

/** Kanal id → gösterilecek değer. Değeri olmayan kanal "veri yok" gösterir. */
export type TelemetryValues = Record<string, number | string | null | undefined>;

/* --------------------------------------------------------------------------
   06-workspaces.md §1.3 — 5 adımlı Executive Intelligence formatı
   -------------------------------------------------------------------------- */

export interface ExecutiveBrief {
  /** 📊 Numbers */
  numbers: Record<string, number | string>;
  /** 🔍 Analysis — neden oldu? */
  analysis: string;
  /** 🧠 Interpretation — ne anlama geliyor? */
  interpretation: string;
  /** 🎯 Recommendation */
  recommendation: AIRecommendation;
  /** 📑 Evidence */
  evidence: EvidenceRef[];
}

/* --------------------------------------------------------------------------
   §8 AmazonSnapshot — 06-workspaces.md §1.3 Layer 1 "Executive Glance"
   -------------------------------------------------------------------------- */

/**
 * SAPMA — UI-ADR-099 (gavadolar danışıldı, terra · luna aynı yönde).
 *
 * Sözleşme `netProfit: Money` diyor, yani ZORUNLU. Gerçekte:
 *   Net kâr = satış − Amazon ücretleri − reklam − iade − COGS − nakliye
 * COGS Amazon'da YOKTUR, kullanıcı girer ve şu an girilmemiştir. Zorunlu bir
 * alan, hesaplanamayan bir değeri ifade edemez; tek çıkış uydurmaktır ve
 * yanlış bir kâr rakamı tüm ODIN'in güvenilirliğini bitirir (13-...md §4).
 *
 * Üç değişiklik, üçü de 13-...md §16.1'e soru olarak düşüldü:
 *   netProfit    → `Money | null`
 *   grossProfit  → opsiyonel; net kâr yokken gösterilebilen TEK kâr
 *   profitBasis  → neyin hariç tutulduğu; gösterilmesi ZORUNLUDUR
 */
export interface AmazonSnapshot {
  /**
   * UI-ADR-093 — yüzde ölçeği BİLDİRİLİR, tahmin edilmez. Sözleşme §8 bunu
   * yazmıyor; zarf başına tek alan olarak eklendi (SAPMA, 13-...md §16.1).
   * `acos` · `tacos` · `buyBoxRate` · `inventoryHealth` bu ölçektedir.
   * TypeScript zorunlu kıldığı için backend atlayamaz.
   */
  percentScale: PercentScale;

  /* Layer 1 — Executive Glance */
  healthScore: number;
  revenue: Money;
  /** null → hesaplanamıyor. Arayüz bu durumda net kâr YAZMAZ. */
  netProfit: Money | null;
  /** Net kâr yokken gösterilen ikame. Tek başına asla "kâr" diye anılmaz. */
  grossProfit?: Money;
  /** Hariç tutulan kalemler — grossProfit gösteriliyorsa yazılması zorunlu. */
  profitBasis?: { excluded: string[] };
  orders: number;
  acos: number;
  tacos: number;
  buyBoxRate: number;
  inventoryHealth: number;
  activeSKUs: number;
  inventoryValue: Money;
  topRisk: Alert | null;
  topOpportunity: Opportunity | null;
  /**
   * Günün Amazon hedefinin ilerlemesi — kaynağı ODIN `goals.py` yayını
   * (`progress_pct`). Mission kavramı Goal'e emekli edildi (ODIN ADR-0132,
   * UI-ADR-107). Ölçülmüyorsa null; goals.alignment()'ın nötr 50'si
   * "ölçülmedi"dir, sınır adaptörü onu null'a çevirir — asla %50 sanılmaz.
   */
  goalProgressPct: number | null;

  /* Layer 2 — Executive Intelligence (5 adımlı format, ExecutiveBrief ile aynı) */
  intelligence: ExecutiveBrief;
}

/* --------------------------------------------------------------------------
   §9 PPCData — 06-workspaces.md §1.5 PPC Intelligence Center
   -------------------------------------------------------------------------- */

export interface PPCOverview {
  /** UI-ADR-093 — `acos` bu ölçektedir. SAPMA, AmazonSnapshot ile aynı gerekçe. */
  percentScale: PercentScale;
  health: number;
  spend: Money;
  sales: Money;
  acos: number;
  roas: number;
  /**
   * ⭐ Ayırt edici metrik — reklam değil KÂR metriği.
   * SAPMA (UI-ADR-099): sözleşmede `Money` zorunlu. Kâr olduğu için net kâr
   * ile aynı kaderi paylaşır: COGS yoksa hesaplanamaz → `null` gelir ve
   * ekranda gerekçesiyle boş görünür.
   */
  profitAfterAds: Money | null;
}

export type CampaignStatus =
  | "healthy"
  | "acos_rising"
  | "budget_exhausting"
  | "scalable"
  | "underperforming";

export interface CampaignIntelligence {
  campaignId: string;
  name: string;
  status: CampaignStatus;
  aiSummary: string;
  suggestedActions: AIRecommendation[];
}

export interface SimulationRequest {
  /** "ppc_budget" */
  parameter: string;
  changePercent: number;
}

export interface SimulationResult {
  scenarios: Array<{ metric: string; expectedChange: string }>;
  confidence: number;
  /** ⚠️ ZORUNLU — varsayımları gösterilmeyen simülasyon açıklanmamış AI çıktısıdır. */
  assumptions: string[];
}

/**
 * İki sözleşme tipinin eşlemesi — yeni ALAN yoktur.
 * Simülatör hazır vakaları listeler; istemci hiçbir sayı HESAPLAMAZ
 * (UI-ADR-100).
 */
export interface SimulationCase {
  request: SimulationRequest;
  result: SimulationResult;
}
