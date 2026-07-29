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

/** Ölçüm penceresi. ISO tarih (YYYY-MM-DD); `to` dahildir. */
export interface MetricPeriod {
  from: string;
  to: string;
}

/**
 * Türetilmiş bir skorun GEREKÇESİ — ADR-0085 Explainability Envelope.
 *
 * `healthScore` bir formülün çıktısıdır. Gerekçesiz gösterilen türetilmiş
 * skor, açıklanamayan bir AI çıktısıdır: kullanıcı "38" görür, ne yapacağını
 * bilemez. Skor doluysa bu alan da doludur (UI-ADR-104).
 */
export interface ScoreFactor {
  /** Makine tarafı kod — ör. "LOW_DAYS_OF_SUPPLY". Arayüz metni bundan üretmez. */
  code: string;
  /** İnsan tarafı açıklama — backend yazar, arayüz cümle kurmaz. */
  message: string;
  direction: "positive" | "negative" | "neutral";
  /** Skora katkısı (puan). Ölçülemiyorsa null — uydurulmaz. */
  contribution: number | null;
}

/**
 * 🟡 TEKLİF — sözleşmesi YOK, ekrandan geriye türetildi. Soru: 13-...md §16.2.
 *
 * `09-data-contracts.md` SKU için hiçbir şey tanımlamıyor; oysa Amazon
 * Director'ın merkezinde SKU Health tablosu ve SKU bağlam paneli var.
 * S5'te `Mission` için izlenen yol burada da izlendi (UI-ADR-101).
 *
 * ⚙️ S6 kapanışında gavadolar danışılarak REVİZE EDİLDİ (UI-ADR-104):
 * dönem alan adına gömülüydü, türetilmiş skorun gerekçesi yoktu, `status`
 * ile skorun hangisinin kazandığı belirsizdi ve kalıcı olarak `null` kalacak
 * bir alan taşınıyordu. Dördü de düzeltildi — gerekçeler ADR'de.
 *
 * ÖLÇEK BİLDİRİLİR, TAHMİN EDİLMEZ (UI-ADR-093): buradaki tüm yüzde alanları
 * **0–100** aralığındadır ve bu, teklifin bir parçasıdır.
 */
export interface SkuHealth {
  sku: string;
  asin: string;
  title: string;

  /** 0–100. Türetilmiş skor; formülü backend'in sorumluluğunda. */
  healthScore: number | null;
  /**
   * Skorun gerekçesi. `healthScore` doluyken bu BOŞ OLAMAZ — gerekçesiz skor
   * gösterilmez, `NoData`'ya düşer (UI-ADR-104).
   */
  healthScoreExplanation: ScoreFactor[] | null;

  status: "healthy" | "watch" | "at_risk" | "critical";
  /**
   * Durumun nereden geldiği. `health_score` ise backend, durumu skorla
   * TUTARLI üretmek zorundadır; `rule_set` ise durum skordan bağımsız bir
   * kuraldan gelir (ör. veri eksikliği) ve ekran bunu söyler.
   *
   * Arayüz çelişki ÇÖZMEZ: skor 38 iken "healthy" gelirse bu bir backend
   * hatasıdır, arayüzün tamir edeceği bir şey değildir.
   */
  statusBasis: "health_score" | "rule_set";

  /* Envanter — FBA Inventory */
  /**
   * ISO 8601 — envanter anlık görüntüsünün alındığı an. Zarfın
   * `lastUpdated`'ından FARKLIDIR: satış raporu 30 dakikalık, FBA envanteri
   * 6 saatlik olabilir ve tükenme kararı bu tazeliğe bağlıdır.
   */
  inventoryAsOf: string | null;
  unitsAvailable: number | null;
  /** Kalan gün = stok / satış hızı. Ölçülemiyorsa null. */
  daysOfSupply: number | null;
  /**
   * ISO 8601 — tahmini tükenme tarihi, GELECEK bir tarih.
   * `daysOfSupply`'dan TÜRETİLMEZ: biri anlık kapasite, diğeri tahmin
   * politikasının (satış hızı penceresi, tedarik takvimi) çıktısıdır.
   */
  estimatedStockoutAt: string | null;
  /** Yeniden sipariş önerisi (adet). Üretilmediyse null. */
  reorderUnits: number | null;

  /* Satış — Sales & Traffic raporu. Dönem ALAN ADINDA DEĞİL, veride. */
  sales: {
    period: MetricPeriod;
    unitsSold: number | null;
    revenue: Money | null;
    /** 0–100 */
    conversionRate: number | null;
    /** 0–100 — kaynağı doğrulanmalı (13-...md §16.2). */
    buyBoxRate: number | null;
  };

  /* Reklam — Ads API */
  advertising: {
    period: MetricPeriod;
    spend: Money | null;
    sales: Money | null;
    /** 0–100 */
    acos: number | null;
  };

  price: Money | null;
}
