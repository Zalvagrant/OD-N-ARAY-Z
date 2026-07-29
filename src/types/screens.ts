/**
 * S5 ekran sözleşmeleri — 🟡 ÖNERİ, doğrulanmadı.
 *
 * `09-data-contracts.md` ekranların TAMAMINI kapsamıyor: Executive Briefing
 * Hero'su, Mission Control'ün Mission Board'u ve sağ paneldeki Intelligence
 * Feed öğesi için sözleşme YOK. Bu dosya onları — 09'un kendisi gibi —
 * ekrandan geriye doğru türetir ve **teklif** olarak işaretler.
 *
 * CLAUDE.md §7 gereği veri modeli tek başımıza değiştirilmedi; sorular
 * `13-backend-recommendations.md` §14'te. Karşılığı hiç olmayan alanlar
 * (ör. AI Readiness) burada UYDURULMADI — `null` gelir ve ekranda NoData
 * çıkar (UI-ADR-096).
 */

import type { Money } from "./executive";

/* --------------------------------------------------------------------------
   05-dashboard.md §3.1 — Hero Section
   -------------------------------------------------------------------------- */

export interface ExecutiveHero {
  /** AI'ın 2–3 cümlelik durum özeti */
  executiveSummary: string;
  /** Günün ana hedefi */
  todaysMission: string | null;
  /** Şu an odaklanılması gereken konu */
  currentFocus: string | null;
  /**
   * Sistem sağlık göstergesi — 09-...md §11 `SystemHealth.score` (0–100).
   * Ölçülmediyse null; "sağlıklı" yazılmaz.
   */
  systemHealthScore: number | null;
  /**
   * AI hazırlık durumu (0–100). Sözleşmede karşılığı YOK — 13-...md §14.1.
   * Üretilene kadar null gelir ve kart o satırda NoData gösterir.
   */
  aiReadiness: number | null;
}

/* --------------------------------------------------------------------------
   05-dashboard.md §5 — Mission Board (Primary Focus Area)
   -------------------------------------------------------------------------- */

export type MissionStatus = "planned" | "active" | "blocked" | "done";

export interface Mission {
  id: string;
  title: string;
  /** Bu görevin hangi hedefe hizmet ettiği — §5 "Current Objectives" */
  objective: string;
  status: MissionStatus;
  /** 0–100. Ölçülmüyorsa null — "%0" ile "bilinmiyor" farklı şeylerdir. */
  progressPercent: number | null;
  /** Sorumlu Director id'si (07-...md §2 dondurulmuş liste) */
  ownerDirector: string;
  /** ISO 8601 — §5 "Upcoming Deadlines" bu alandan türer. */
  deadline: string | null;
  /** Varsa ilgili karar — Decision Center'a köprü */
  relatedDecisionId?: string;
  /** Görevi engelleyen şey; `status === "blocked"` iken beklenir. */
  blockedReason?: string;
}

/* --------------------------------------------------------------------------
   05-dashboard.md §6 — Executive Intelligence Feed (sağ panel)
   -------------------------------------------------------------------------- */

/** §6'daki 10 kategori. Liste dondurulmuştur; yenisi ADR ister. */
export type IntelligenceCategory =
  | "critical_risk"
  | "ai_recommendation"
  | "director_activity"
  | "pending_approval"
  | "market_intelligence"
  | "competitor_alert"
  | "amazon_anomaly"
  | "financial_deviation"
  | "security_event"
  | "new_knowledge";

export interface IntelligenceItem {
  id: string;
  category: IntelligenceCategory;
  title: string;
  detail?: string;
  /** ISO 8601 — yoksa zaman UYDURULMAZ, satırda NoData çıkar. */
  at: string | null;
  /** 1 (en yüksek) … 5. Sıralamayı AI yapar (§6). */
  priority: 1 | 2 | 3 | 4 | 5;
  /** Olayı üreten Director / modül */
  actor?: string;
}

/* --------------------------------------------------------------------------
   06-workspaces.md §1.4 — SKU Health · §1.7 SKU bağlam paneli
   -------------------------------------------------------------------------- */

/**
 * 🟡 TEKLİF — sözleşmesi YOK, ekrandan geriye türetildi. Soru: 13-...md §15.2.
 *
 * `09-data-contracts.md` SKU için hiçbir şey tanımlamıyor; oysa Amazon
 * Director'ın merkezinde SKU Health tablosu ve SKU bağlam paneli var.
 * S5'te `Mission` için izlenen yol burada da izlendi (UI-ADR-100).
 *
 * ÖLÇEK BİLDİRİLİR, TAHMİN EDİLMEZ (UI-ADR-093): buradaki tüm yüzde alanları
 * **0–100** aralığındadır ve bu, teklifin bir parçasıdır.
 *
 * ÖLÇÜLEMEYEN ALAN `null` GELİR — mock'ta bile doldurulmaz:
 *   `grossMarginPerUnit` COGS gerektirir, COGS Amazon'da yoktur → kalıcı null.
 */
export interface SkuHealth {
  sku: string;
  asin: string;
  title: string;
  /** 0–100. Türetilmiş bir skordur; formülü backend'in sorumluluğunda. */
  healthScore: number | null;
  status: "healthy" | "watch" | "at_risk" | "critical";

  /* Envanter — FBA Inventory */
  unitsAvailable: number | null;
  /** Kalan gün = stok / satış hızı. Ölçülemiyorsa null. */
  daysOfSupply: number | null;
  /** ISO 8601 — tahmini tükenme tarihi. GELECEK bir tarihtir. */
  estimatedStockoutAt: string | null;
  /** Yeniden sipariş önerisi (adet). Üretilmediyse null. */
  reorderUnits: number | null;

  /* Satış — Sales & Traffic raporu */
  unitsSoldLast30d: number | null;
  revenueLast30d: Money | null;
  /** 0–100 */
  conversionRate: number | null;
  /** 0–100 — kaynağı doğrulanmalı (13-...md §4 "Buy Box oranı ⚠️"). */
  buyBoxRate: number | null;

  /* Reklam — Ads API */
  adSpendLast30d: Money | null;
  adSalesLast30d: Money | null;
  /** 0–100 */
  acos: number | null;

  /* Kâr — COGS OLMADAN HESAPLANAMAZ, kalıcı olarak null (UI-ADR-098) */
  grossMarginPerUnit: Money | null;

  price: Money | null;
}
