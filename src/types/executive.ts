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
   §1 ExecutiveKPI — 05-dashboard.md §4 katmanlı kart
   -------------------------------------------------------------------------- */

/** Yüzde değerinin hangi aralıkta geldiği. Tahmin edilmez, bildirilir. */
export type PercentScale = "0-1" | "0-100";

export interface ExecutiveKPI {
  id: string;
  label: string;
  value: number;
  unit: "currency" | "percent" | "count" | "score";
  currency?: string;
  /** `unit === "percent"` ise ZORUNLU. Yoksa değer render edilmez. */
  scale?: PercentScale;

  /* Level 1 — her zaman görünür */
  trend: {
    direction: "up" | "down" | "flat";
    changePercent: number;
    comparedTo: string;
  };
  sparkline: (number | null)[];

  /* Level 2 — açılınca */
  aiInsight: string;
  confidence: number;
  forecast: { value: number; horizon: string; confidence: number };
  risk: "none" | "low" | "medium" | "high" | "critical";

  /* Level 3 */
  recommendedAction?: AIRecommendation;
  evidence: EvidenceRef[];
  owner: string;
}

/* --------------------------------------------------------------------------
   §2 Decision
   -------------------------------------------------------------------------- */

/*
 * ⚙️ KANONİK HALE GETİRİLDİ — UI-ADR-105 (S7).
 *
 * Bu tip artık ODIN'in `schemas/decision-record.schema.json` şemasının
 * arayüz karşılığıdır; ekrandan geriye türetilmiş eski hâli DEĞİL.
 * Kaynak ve fark tablosu: `09b-verified-contracts.md` §1.
 *
 * Neden yeniden yazıldı: eski tipin 13 alanının ODIN'de karşılığı yoktu,
 * buna karşılık ODIN'in **zorunlu tuttuğu dört alan arayüzde hiç yoktu.**
 * Kayıp alan uydurulmuş alandan tehlikelidir: uydurulmuş alan en azından
 * `NoData` gösterir, kayıp alan sessizdir — CEO o bilgiyi hiç görmemiş olur.
 */

/** ODIN kararı üç kademeye ayırır. Arayüzün `priority: 1..5`'i uydurmaydı. */
export type DecisionTier = "D1" | "D2" | "D3";

/** ODIN'de ÜÇ durum vardır, arayüzdeki dokuz değil. */
export type DecisionStatus = "open" | "monitoring" | "closed";

/**
 * Güven skorunun bileşeni — `odin/trust.py::CONFIDENCE_COMPONENTS`.
 * Sekiz bileşen ağırlıklı toplanır; beşi olumlu, üçü olumsuz yönde.
 */
export interface ConfidenceComponent {
  /** Makine tarafı ad: `knowledge_coverage`, `evidence_strength`, … */
  key: string;
  /** İnsan tarafı etiket — backend yazar, arayüz cümle kurmaz. */
  label: string;
  /** 0–100 */
  score: number;
  weight: number;
  /** `risk_level` · `missing_information` · `decision_complexity` negatiftir. */
  direction: "positive" | "negative";
}

/** `odin/consensus.py::aggregate` → `minority_opinions` listesi. */
export interface MinorityOpinion {
  member: string;
  option: string;
  rationale: string;
}

/**
 * Kararın önerisi — şemada iç içe nesne, **on alanı da zorunlu**.
 * `odin/decision.py::build_recommendation` eksik alan varsa öneriyi HİÇ
 * üretmez (`IncompleteRecommendation`) — arayüzün "eksikse gösterme"
 * kuralının backend'de zaten karşılığı vardır.
 *
 * `AIRecommendation` ile KARIŞTIRILMAZ: o, fırsat/KPI gibi yerlerdeki
 * serbest AI önerisidir; bu, bir kararın şemaya bağlı önerisidir.
 */
export interface DecisionRecommendation {
  text: string;
  /** 0–100 */
  confidence: number;
  /** Güvenin NEDEN o değer olduğu. Boş gelirse skor gösterilmez. */
  confidenceBreakdown: ConfidenceComponent[];
  evidenceSnapshot: EvidenceRef[];
  risks: string[];
  /** Öneri neye dayanıyor — varsayım gösterilmeyen öneri açıklanmamıştır. */
  assumptions: string[];
  /** 0–100 */
  consensusScore: number;
  /**
   * TÜRETİLMİŞTİR: `100 - consensusScore` (`odin/consensus.py`).
   * 10b §11'in "ikisi ayrı ölçümdür" iddiası YANLIŞTI — tek ölçüm var.
   */
  disagreementScore: number;
  minorityOpinions: MinorityOpinion[];
  /**
   * 🔴 EN KRİTİK ALAN: "Bu öneriyi ne değiştirir?"
   * ODIN bunu ZORUNLU tutar, arayüz hiç göstermiyordu. Flip koşulu
   * olmayan bir öneri, sorgulanamayan bir öneridir.
   */
  flipConditions: string[];
}

/**
 * İnsanın kararı. `decided_by` şemada **const: "human-owner"** —
 * ODIN kendi kendine karar kapatamaz (09b §4).
 */
export interface HumanDecision {
  /** Serbest metin: onay, ret ve erteleme aynı alanda kayıt olur. */
  outcome: string;
  decidedBy: "human-owner";
  /**
   * Sahibin gerekçesi. Şema zorunlu tutmuyor ama alan var; D1/D2'de
   * arayüz zorunlu kılar (sahip kararı §15.1-C, UI-ADR-106).
   */
  reasoning?: string;
  /** ISO 8601 */
  decidedAt?: string;
}

/** İzleme kontrol noktası — kararın sonucu ne zaman ölçülecek. */
export interface MonitoringCheckpoint {
  id: string;
  /** ISO 8601 */
  at: string;
  metric: string;
  /** Beklenen değer/eşik — metin, çünkü şema serbest bırakıyor. */
  expected: string;
}

/** Kontrol noktasının sonucu — karar KAPANDIKTAN sonra doldurulur. */
export interface CheckpointEvaluation {
  checkpointId: string;
  /** ISO 8601 */
  evaluatedAt: string;
  observed: string;
  verdict: "on_track" | "off_track" | "inconclusive";
}

export interface Decision {
  id: string;
  /** ISO 8601 — şemada zorunlu. */
  date: string;
  /** Kararın SORUSU. Eski `title` bunun karşılığıdır. */
  question: string;
  tier: DecisionTier;
  /**
   * En az 2 — ve bu, **KARARIN** alanıdır, önerinin değil (09b §1).
   * UI-ADR-091 alternatif kuralını öneriye bağlamıştı; dayanağı oynadı.
   */
  alternatives: Alternative[];
  recommendation: DecisionRecommendation;
  /** Karar verilmediyse `null` — "henüz karar yok" ile "ret" farklıdır. */
  humanDecision: HumanDecision | null;
  status: DecisionStatus;

  /* --- Şemada opsiyonel --- */
  domain?: string;
  reason?: string;
  expectedOutcome?: string;
  actualOutcome?: string;
  lessonsLearned?: string;
  monitoringCheckpoints?: MonitoringCheckpoint[];
  checkpointEvaluations?: CheckpointEvaluation[];
  relatedDecisions?: string[];
  relatedGoals?: string[];
  linkedStandards?: string[];
  linkedExperiments?: string[];

  /* --- ODIN'de KARŞILIĞI YOK, doküman istiyor (06-...md §2.4 "Decision DNA").
     Uydurulmadı: opsiyonel bırakıldı, gelmezse ilgili satır HİÇ ÇİZİLMEZ.
     Governance talebi sorusu 13-...md §17.1'de. --- */
  financialImpact?: { amount: number; currency: string; horizon: string };
  riskLevel?: "low" | "medium" | "high" | "critical";
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
   §6 Alert · §7 Opportunity
   -------------------------------------------------------------------------- */

export interface Alert {
  id: string;
  severity: "info" | "warning" | "risk" | "critical";
  title: string;
  description: string;
  module: string;
  affectedEntities: string[];
  suggestedMitigation?: string;
  responsibleDirector: string;
  /** false ise Alerts listesine GİRMEZ (09-...md §6). */
  requiresAction: boolean;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  category: "product" | "pricing" | "advertising" | "bundle" | "keyword" | "other";
  revenueImpact: Money;
  confidence: number;
  deadline?: string;
  recommendedAction: AIRecommendation;
  evidence: EvidenceRef[];
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
  missionProgress: number;

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
