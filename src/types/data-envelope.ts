/**
 * ODIN Data Envelope
 * Kaynak: docs/ui_chatgpt/09-data-contracts.md §0
 *
 * KURAL: Veri taşıyan HER bileşen bu zarfı alır.
 *        meta olmadan bileşen render edilmez.
 *
 * Bu, "Trust Signals" kuralının (02-design-principles.md §8) teknik
 * karşılığıdır: kullanıcı hiçbir zaman "bu bilgi güncel mi?" diye
 * düşünmemelidir.
 */

/**
 * `mock` — UI-ADR-094. S5'te ekranlar mock veriyle beslenir. Mock'un
 * zarfta AYRI BİR KAYNAK olması şart: böylece gerçek veriden tip
 * seviyesinde ayrılır, TrustSignal onu "mock" diye yazar ve S8'de
 * geçiş yapılırken hiçbir mock sessizce kalamaz (`meta.source === "mock"`
 * araması tamamını bulur).
 */
export type DataSource =
  | "sp-api" | "ads-api" | "internal" | "ai" | "manual" | "computed" | "mock";

export type Freshness = "live" | "recent" | "stale";

export interface DataMeta {
  source: DataSource;
  /** ISO 8601 */
  lastUpdated: string;
  freshness: Freshness;
  /** AI üretimi ise ZORUNLU (0–100). Üretilemiyorsa alan hiç olmaz. */
  confidence?: number;
}

export interface DataEnvelope<T> {
  data: T;
  meta: DataMeta;
}

/**
 * ODIN'in KENDİ projeksiyonundan gelen ham yükü zarfa sarar — UI-ADR-137.
 *
 * `odin-state.ts:49` ve `odin-amazon.ts:82`'de BİREBİR AYNI gövdeyle iki
 * kez yazılıydı ve gerekçesi yalnız birinin başında duruyordu. İkiye
 * bölünmüş bir kural, yarısı okunmayan bir kuraldır.
 *
 * `source: "internal"` çünkü veri SP-API'den DEĞİL, ODIN'in kendi
 * projeksiyonundan geliyor: altındaki kayıtlar SP-API ve Ads'ten gelse de
 * tek zarf ikisini birden etiketleyemez, zarfı "sp-api" damgalamak reklam
 * sayıları için yalan olurdu.
 *
 * `freshness` BURADA YAZILMAZ, `parseEnvelope` onu `lastUpdated`tan modül
 * eşiğine göre İSTEMCİDE yeniden hesaplar (UI-ADR-115) — adaptörün "live"
 * damgalaması yanıltıcı olurdu. Buradaki değer yalnızca yer tutucudur.
 */
export function internalEnvelope<T>(
  generatedAt: string,
  data: T
): DataEnvelope<T> {
  return {
    data,
    meta: { source: "internal", lastUpdated: generatedAt, freshness: "live" },
  };
}

/**
 * Freshness eşikleri — modüle göre değişir, konfigüre edilebilir.
 * 09-data-contracts.md §0
 */
export const FRESHNESS_THRESHOLDS_MS: Record<string, { live: number; recent: number }> = {
  trading: { live: 30_000,    recent: 5 * 60_000 },      // 30sn / 5dk
  amazon:  { live: 15 * 60_000, recent: 60 * 60_000 },   // 15dk / 1sa
  finance: { live: 60 * 60_000, recent: 24 * 60 * 60_000 },
  default: { live: 5 * 60_000,  recent: 60 * 60_000 },
};

export function computeFreshness(
  lastUpdated: string,
  module: keyof typeof FRESHNESS_THRESHOLDS_MS = "default"
): Freshness {
  const t = FRESHNESS_THRESHOLDS_MS[module] ?? FRESHNESS_THRESHOLDS_MS.default;
  const age = Date.now() - new Date(lastUpdated).getTime();
  if (age <= t.live) return "live";
  if (age <= t.recent) return "recent";
  return "stale";
}

/**
 * ANTI-FAKE GUARD.
 * Bir bileşen render öncesi bunu çağırır.
 * false dönerse "veri yok" durumu gösterilir — sahte içerik ÜRETİLMEZ.
 */
export function canRender<T>(env: DataEnvelope<T> | null | undefined): boolean {
  if (!env?.data) return false;
  if (!env.meta?.source || !env.meta?.lastUpdated) return false;
  return true;
}

/**
 * AI çıktısı gösterilebilir mi?
 * Confidence üretilemiyorsa gösterilmez (13-backend-recommendations.md §9).
 */
export function canShowConfidence(meta: DataMeta): boolean {
  return meta.source === "ai" && typeof meta.confidence === "number";
}
