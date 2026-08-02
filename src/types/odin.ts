/**
 * ODIN kanonik sözleşme tipleri — UI-ADR-098 / 099.
 *
 * KAYNAK: ODIN reposu `schemas/decision-record.schema.json`
 * (snapshot: `contracts/odin/decision-record.schema.json`,
 * ODIN commit 0d76dae). Bu dosya şemanın BİREBİR TypeScript karşılığıdır;
 * alan icat edilmez, ad değiştirilmez (snake_case korunur — adapter
 * katmanı UI adlarına çevirir, tip katmanı çevirmez).
 *
 * FR-0039 fixture kanalı ODIN'de yayına girince snapshot yerini pinlenmiş
 * artefakta bırakır; test aynı kalır.
 */

/* --------------------------------------------------------------------------
   Karar kaydı — decision-record.schema.json
   -------------------------------------------------------------------------- */

/** D1 geri alınabilir/düşük · D2 geri alması maliyetli · D3 stratejik. */
export type OdinDecisionTier = "D1" | "D2" | "D3";

export type OdinDecisionStatus = "open" | "monitoring" | "closed";

/** ODIN'de alternatif KARARIN alanıdır (minItems 2) — önerinin değil. */
export interface OdinAlternative {
  option: string;
  assessment: string;
  risk?: string;
}

/** Kanonik güven formülünün 8 bileşeni (Trust Standard). Kara kutu sayı yok. */
export interface OdinConfidenceBreakdown {
  knowledge_coverage: number;
  evidence_strength: number;
  expert_agreement: number;
  model_agreement: number;
  historical_success: number;
  /** Negatif yönlü: yükseldikçe güven DÜŞER. */
  risk_level: number;
  missing_information: number;
  decision_complexity: number;
}

/** Karar anındaki gömülü kanıt kopyası (Replay şartı) — canlı referans değil. */
export interface OdinEvidenceSnapshot {
  knowledge_id: string;
  knowledge_version: number;
  trust_at_decision: number;
  role?: "supporting" | "contradicting";
  summary?: string;
  caveat?: string;
}

/** Şemada 10 alanın HEPSİ zorunlu; biri eksikse ODIN öneriyi hiç üretmez. */
export interface OdinRecommendation {
  text: string;
  confidence: number;
  confidence_breakdown: OdinConfidenceBreakdown;
  evidence_snapshot: OdinEvidenceSnapshot[];
  risks: string[];
  assumptions: string[];
  consensus_score: number;
  /** ODIN'de 100 - consensus_score olarak ÜRETİLİR (consensus.py). */
  disagreement_score: number;
  /** "üye: seçenek — gerekçe" biçiminde düz metin listesi. */
  minority_opinions: string[];
  /** "Bu öneriyi ne değiştirir?" — en kritik açıklanabilirlik alanı. */
  flip_conditions: string[];
}

export interface OdinHumanDecision {
  outcome: string;
  /** Şemada const: yalnızca insan karar kapatır (ADR-0086). */
  decided_by: "human-owner";
  human_reasoning?: string;
}

export interface OdinDecisionRecord {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  question: string;
  tier: OdinDecisionTier;
  alternatives: OdinAlternative[];
  recommendation: OdinRecommendation;
  human_decision: OdinHumanDecision;
  status: OdinDecisionStatus;

  domain?: string;
  reason?: string;
  expected_outcome?: string;
  monitoring_checkpoints?: string[];
  actual_outcome?: string;
  lessons_learned?: string[];
  linked_experiments?: string[];
  linked_standards?: string[];
  related_decisions?: string[];
  related_goals?: string[];
  checkpoint_evaluations?: {
    date: string;
    actual: string;
    result: "met" | "partial" | "diverged";
    lesson?: string;
  }[];
}

/* --------------------------------------------------------------------------
   Verdict — odin/lifecycle.py (ADR-0131)
   -------------------------------------------------------------------------- */

export const ODIN_VERDICTS = ["approved", "rejected", "deferred"] as const;
export type OdinVerdict = (typeof ODIN_VERDICTS)[number];

/** Öneri sınıfı — odin/executive.py classify(). Gerekçe kuralının anahtarı. */
export type OdinRecClass = "A" | "B" | "C";

/** ADR-0131: class-B/C verdiktinde gerekçe zorunlu, en az bu kadar karakter. */
export const ODIN_MIN_REASON_CHARS = 8;

/** B ve C gerekçe ister; A bilgilendirmedir, onay bile gerektirmez. */
export const ODIN_REASON_REQUIRED_CLASSES: readonly OdinRecClass[] = ["B", "C"];

/**
 * ODIN'in serbest `klass` alanı → sınıf sözlüğü. Yalnız A/B/C geçer;
 * `null` ve bilinmeyen değer `undefined` olur — yani gerekçe ZORUNLU
 * kalır (UI-ADR-156 fail-closed). Sessizce bir sınıfa dönüştürme yok
 * (UI-ADR-194, gavadolar 2/2).
 */
export function toRecClass(
  klass: string | null | undefined
): OdinRecClass | undefined {
  return klass === "A" || klass === "B" || klass === "C" ? klass : undefined;
}

/* --------------------------------------------------------------------------
   Confidence bantları — odin/trust.py CONFIDENCE_LEVELS
   -------------------------------------------------------------------------- */

/** Kanonik 5 bant. UI kendi eşiğini İCAT ETMEZ (eski 80/50 kaldırıldı). */
export const ODIN_CONFIDENCE_LEVELS = [
  [80, "very-high"],
  [60, "high"],
  [40, "moderate"],
  [20, "low"],
  [0, "very-low"],
] as const;

export type OdinConfidenceLevel = (typeof ODIN_CONFIDENCE_LEVELS)[number][1];

export function odinConfidenceLevel(score: number): OdinConfidenceLevel {
  for (const [threshold, label] of ODIN_CONFIDENCE_LEVELS) {
    if (score >= threshold) return label;
  }
  return "very-low";
}
