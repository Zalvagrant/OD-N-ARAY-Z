/**
 * S6 Amazon Director veri sözleşmeleri.
 *
 * İKİ KATMAN VAR, KARIŞTIRILMAZ:
 *
 * 1. `09-data-contracts.md` §8 (AmazonSnapshot) ve §9 (PPCData) — GERÇEK
 *    sözleşme. Buradaki TS karşılıkları birebirdir; alan icat edilmez.
 * 2. 🟡 TEKLİF — `Sku` ve `SalesPoint`. `06-workspaces.md` §1.4 ve §1.7 bu
 *    ekranları istiyor ama 09'da karşılıkları YOK. `types/screens.ts`'teki
 *    `Mission` gibi ekrandan geriye türetildiler ve teklif olarak işaretliler.
 *    Sorular `13-backend-recommendations.md` §15'te.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * YÜZDE ÖLÇEĞİ — UI-ADR-093 buraya da uygulanır.
 *
 * §8 `acos/tacos/buyBoxRate` ve §9 `PPCOverview.acos` çıplak `number`. 18,1
 * mi 0,181 mi? Tahmin edilmez: bu dosyadaki §8/§9 karşılıklarına TEK bir
 * `percentScale` alanı eklendi (dokümante edilmiş sapma, soru §15.1).
 * Gelmezse yüzdeler ekranda NoData çıkar — bilinçli ve doğru davranış.
 *
 * TEKLİF tiplerinde (`Sku`) ölçek alanı YOK, çünkü ölçeği sözleşmenin
 * kendisi BİLDİRİYOR: yüzde alanları 0–100'dür. UI-ADR-093 tahmini yasaklar,
 * bildirimi değil.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NET KÂR — en riskli alan (09-...md §8 uyarısı, 13-...md §4).
 *
 * §8 `netProfit: Money` diyor. Ama net kâr = satış − Amazon ücretleri
 * − reklam − iade − COGS − nakliye ve COGS Amazon'da YOKTUR. Kalemlerden
 * biri eksikse gösterilen net kâr YANLIŞTIR; yanlış bir kâr rakamı tüm
 * ODIN'in güvenilirliğini bitirir.
 *
 * Karar (UI-ADR-099, gavadolar danışıldı — terra ve luna aynı yönde):
 * arayüz net kârı HESAPLAMAZ. Backend hesaplayamıyorsa `netProfit: null`
 * gönderir ve `profitFallback` ile hangi kalemlerin hariç olduğunu bildirir.
 * Arayüzün tek işi doğru kartı seçmektir — bu bir türetme değil, guard'dır.
 */

import type {
  AIRecommendation,
  Alert,
  EvidenceRef,
  Money,
  Opportunity,
  PercentScale,
} from "./executive";

/* --------------------------------------------------------------------------
   Kâr — 09-...md §8 `netProfit` alanının dürüst hâli (UI-ADR-099)
   -------------------------------------------------------------------------- */

/** Net kâr hesabına giren maliyet kalemleri (13-...md §4). */
export type ProfitCostCode =
  | "amazon_fees"
  | "ads"
  | "returns"
  | "cogs"
  | "shipping"
  | "storage";

export interface ProfitFallback {
  /** Ücretler ve diğer eksik kalemler HARİÇ kâr. */
  grossProfit: Money;
  /** Bu kalemler hesaba KATILMADI — kullanıcıya açıkça yazılır. */
  excluded: ProfitCostCode[];
}

/* --------------------------------------------------------------------------
   §8 AmazonSnapshot — Layer 1 Executive Glance + Layer 2 Intelligence
   -------------------------------------------------------------------------- */

export interface AmazonSnapshot {
  /** 0–100 */
  healthScore: number;
  revenue: Money;
  /**
   * SAPMA (§8'de `Money`): hesaplanamıyorsa `null` gelir ve `profitFallback`
   * dolu olur. Bkz. dosya başlığı ve UI-ADR-099.
   */
  netProfit: Money | null;
  profitFallback: ProfitFallback | null;

  orders: number;
  /** Yüzde — ölçeği `percentScale` bildirir. */
  acos: number;
  tacos: number;
  buyBoxRate: number;
  /** SAPMA: §8'de yok. Yüzde alanlarının ölçeği (UI-ADR-093). */
  percentScale: PercentScale | null;

  /** 0–100 skorlar (§8 `healthScore` yorumuyla aynı aralık). */
  inventoryHealth: number;
  missionProgress: number;

  activeSKUs: number;
  inventoryValue: Money;
  topRisk: Alert | null;
  topOpportunity: Opportunity | null;

  /** Layer 2 — 5 adımlı format. `ExecutiveBrief` ile aynı yapı. */
  intelligence: {
    numbers: Record<string, number | string>;
    analysis: string;
    interpretation: string;
    recommendation: AIRecommendation;
    evidence: EvidenceRef[];
  };
}

/* --------------------------------------------------------------------------
   §9 PPCData — dört katman
   -------------------------------------------------------------------------- */

export interface PPCOverview {
  /** 0–100 */
  health: number;
  spend: Money;
  sales: Money;
  /** Yüzde — ölçeği `percentScale` bildirir. */
  acos: number;
  /** Oran (5.4 = 5,4×), yüzde değildir. */
  roas: number;
  /** SAPMA: §9'da yok. UI-ADR-093. */
  percentScale: PercentScale | null;
  /** ⭐ Ayırt edici metrik: reklam değil KÂR metriği. */
  profitAfterAds: Money;
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
  /** Örn. "ppc_budget" */
  parameter: string;
  changePercent: number;
}

export interface SimulationResult {
  scenarios: Array<{ metric: string; expectedChange: string }>;
  confidence: number;
  /** ⚠️ ZORUNLU — varsayımları gösterilmeyen simülasyon açıklanmamış bir AI çıktısıdır. */
  assumptions: string[];
}

/* --------------------------------------------------------------------------
   🟡 TEKLİF — Sku. 06-...md §1.4 (SKU Health · Inventory) ve §1.7 (sağ panel).
   Sözleşmesi 09'da YOK; soru 13-...md §15.2.

   Yüzde alanları (conversionRate · buyBoxRate · acos) 0–100'dür ve bunu bu
   sözleşme BİLDİRİR. Ölçülmeyen alan `null`'dır — "0" yazılmaz.
   -------------------------------------------------------------------------- */

export type SkuStatus = "healthy" | "watch" | "at_risk" | "critical";

export interface SkuHistoryEvent {
  /** ISO 8601 */
  at: string;
  title: string;
}

export interface Sku {
  sku: string;
  asin: string | null;
  title: string;

  /* SKU Health */
  /** 0–100 */
  healthScore: number | null;
  status: SkuStatus;

  /* Financial Metrics — son 30 gün */
  unitsSold30d: number | null;
  revenue30d: Money | null;
  /** Ücretler hariç. Net kâr için `netProfit30d` + `profitFallback`. */
  grossProfit30d: Money | null;
  /** Hesaplanamıyorsa null — UI-ADR-099. */
  netProfit30d: Money | null;
  profitFallback: ProfitFallback | null;
  /** 0–100 */
  conversionRate: number | null;

  /* Advertising */
  adSpend30d: Money | null;
  adSales30d: Money | null;
  /** 0–100 */
  acos: number | null;

  /* Inventory Intelligence */
  unitsAvailable: number | null;
  /** Tahmini tükenme süresi (gün). Ölçülmüyorsa null. */
  daysOfSupply: number | null;
  leadTimeDays: number | null;
  /** Yeniden sipariş önerisi (adet). Üretilmediyse null. */
  restockUnits: number | null;

  /* BuyBox */
  /** 0–100 */
  buyBoxRate: number | null;
  buyBoxOwned: boolean | null;

  /* History + AI */
  history: SkuHistoryEvent[];
  recommendation?: AIRecommendation;
}

/* --------------------------------------------------------------------------
   🟡 TEKLİF — SalesPoint. 06-...md §1.4 "Sales & Profit: günlük/haftalık/
   aylık/yıllık analiz". Soru 13-...md §15.3.
   -------------------------------------------------------------------------- */

export interface SalesPoint {
  /** Eksen etiketi — dönemi çağıran değil üretici belirler. */
  label: string;
  revenue: number;
  orders: number;
  /** Ücretler hariç kâr. Ölçülemiyorsa null — çizgi kesilir, uydurulmaz. */
  grossProfit: number | null;
}
