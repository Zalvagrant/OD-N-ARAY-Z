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

import type {
  OdinAlternative,
  OdinConfidenceBreakdown,
  OdinDecisionStatus,
  OdinDecisionTier,
  OdinRecClass,
  OdinVerdict,
} from "./odin";

export type {
  OdinAlternative,
  OdinConfidenceBreakdown,
  OdinDecisionTier,
  OdinVerdict,
} from "./odin";

export interface Money {
  amount: number;
  currency: string;
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

/* --------------------------------------------------------------------------
   §3 AIRecommendation — 7 alanlı explainability sözleşmesi
   -------------------------------------------------------------------------- */

export interface AIRecommendation {
  id: string;
  /** ODIN `recommendation.text` */
  recommendation: string;
  /** 0–100 — bantları ODIN belirler (types/odin.ts), UI eşik icat etmez. */
  confidence: number;
  /** ODIN `confidence_breakdown` — 8 kanonik bileşen. Kara kutu sayı yok. */
  confidenceBreakdown: OdinConfidenceBreakdown;
  /** ODIN `evidence_snapshot` karşılığı (UI zenginleştirilmiş biçimi). */
  evidence: EvidenceRef[];
  /** ODIN `risks` */
  potentialRisks: string[];
  /** ODIN `assumptions` — öneri neye dayanıyor. */
  assumptions: string[];
  /** ODIN `flip_conditions` — "bu öneriyi ne değiştirir?" En kritik
      açıklanabilirlik alanı; UI-ADR-098'e kadar HİÇ gösterilmiyordu. */
  flipConditions: string[];
  /** ODIN `consensus_score` (0–100). */
  consensusScore: number;
  /** ODIN `disagreement_score` = 100 − consensus (consensus.py TÜRETİR;
      UI ayrı ölçüm sanmaz — UI-ADR-100). */
  disagreementScore: number;
  /** ODIN `minority_opinions` — "üye: seçenek — gerekçe" düz metinleri. */
  minorityOpinions: string[];

  /** Verdict gerekçe kuralının anahtarı (executive.classify, ADR-0131):
      A bilgilendirme · B/C'de gerekçe ≥8 karakter zorunlu. */
  recClass?: OdinRecClass;

  /* ------------------------------------------------------------------
     ODIN karar şemasında OLMAYAN alanlar — hepsi opsiyonel ve adapter
     tablosunda `not_exposed` işaretli (09b §9). Kaynakları oluşursa
     dolar; UI bunları ASLA zorunlu saymaz, yoksa satır çizilmez.
     `alternatives` BURADAN KALDIRILDI: ODIN'de kararın alanıdır
     (UI-ADR-091 ♻️ revizyonu → UI-ADR-100).
     ------------------------------------------------------------------ */
  numbers?: Record<string, number | string>;
  causeAnalysis?: string;
  impactAnalysis?: string;
  expectedFinancialResult?: { amount?: number; percent?: number; currency?: string };
  whyGenerated?: string;
  responsibleDirector?: string;
  relatedKnowledge?: string[];
  /** ISO 8601 */
  lastValidated?: string;
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

export type DecisionStatus = OdinDecisionStatus;

export interface DecisionEvent {
  id: string;
  at: string;
  title: string;
  description?: string;
}

/**
 * ODIN `DecisionRecord`un UI görünümü (09b §1). Alan adları camelCase'e
 * çevrilir, ANLAM değiştirilmez. Eski 19 alanlık UI tipi UYDURMAYDI
 * (UI-ADR-098): priority/financialImpact/riskLevel/expectedROI/
 * directorOpinions/timeline/score ODIN'de yok ve kaldırıldı.
 */
export interface Decision {
  id: string;
  /** ODIN `question` — kart başlığı budur. */
  question: string;
  /** YYYY-MM-DD */
  date: string;
  /** D1 geri alınabilir · D2 geri alması maliyetli · D3 stratejik. */
  tier: OdinDecisionTier;
  status: OdinDecisionStatus;
  domain?: string;

  /** KARARIN alanı, en az 2 (şema minItems) — önerinin değil. */
  alternatives: OdinAlternative[];
  recommendation: AIRecommendation;

  /** Verdict verildiyse. Yalnızca insan kapatır (decided_by const). */
  humanDecision?: {
    outcome: OdinVerdict;
    humanReasoning?: string;
    /** `deferred` için zorunlu gelecek tarih (ADR-0131). */
    revisitAt?: string;
  };

  expectedOutcome?: string;
  monitoringCheckpoints?: string[];
  lessonsLearned?: string[];
  relatedDecisions?: string[];
}

/* --------------------------------------------------------------------------
   §4 DirectorHeartbeat
   -------------------------------------------------------------------------- */

/** ODIN verdict sözlüğü — health.py yalnız bu üçünü yazar. */
export type AgentVerdict = "unknown" | "healthy" | "unhealthy";

/**
 * ODIN `AgentHealthMonitor.snapshot()` girdisinin UI görünümü (09b §5,
 * UI-ADR-111). Eski `DirectorHeartbeat` 8 UYDURULMUŞ alan taşıyordu
 * (status/currentGoal/currentTask/confidence/taskCount/evidenceCount/
 * recommendationCount/memoryHealth/predictionStatus/beatIntervalMs) ve
 * ODIN'in ürettiği GERÇEK metrikleri (gecikme, başarı oranı, maliyet)
 * hiç göstermiyordu — kayıp alan, uydurmadan tehlikelidir.
 *
 * CANLILIK KURALI UI'DA TÜRETİLMEZ: eski "beatIntervalMs × 3" eşiği UI
 * icadıydı ve kaldırıldı. UI yalnız ODIN'in verdiği `verdict`i gösterir;
 * `last_heartbeat` bir zaman damgası olarak sunulur (yaşı yazılır,
 * yorumlanmaz).
 */
export interface AgentHealth {
  agentId: string;
  /** Görünen ad — UI eşlemesi (agent registry'den). */
  name: string;
  verdict: AgentVerdict;
  consecutiveFailures: number;
  /** ISO 8601 | null */
  lastSuccess: string | null;
  lastFailure: string | null;
  metrics: {
    latencyMsAvg: number | null;
    latencyMsP95: number | null;
    /** 0–1 */
    successRate: number | null;
    errorRate: number | null;
    tokensUsed: number;
    costUsd: number | null;
    queueLength: number;
    availability: number | null;
    /** ISO 8601 | null — yaş yazılır, canlılık YORUMLANMAZ. */
    lastHeartbeat: string | null;
  };
  checkedAt: string | null;
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
