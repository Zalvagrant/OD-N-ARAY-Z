/**
 * Modüle göre önbellek politikası — S7 D7.1.
 *
 * Tek yerdedir; bileşenler kendi `staleTime`'ını yazmaz. Eşikler
 * `types/data-envelope.ts`'teki FRESHNESS eşikleriyle AYNI kaynaktan gelir:
 * bir verinin "bayat" sayıldığı an ile yeniden çekildiği an ayrışırsa,
 * ekran "bayat" yazarken arka planda hiçbir şey olmaz.
 *
 * EXECUTIVE TIMING (02-design-principles.md): KPI arka planda tazelenir ama
 * bunu kullanıcı FARK ETMEZ — odak kaybında yeniden çekme kapalıdır ve eski
 * veri, yenisi gelene kadar ekranda kalır. Sayının gözünün önünde titremesi
 * bir "canlılık" işareti değil, dikkat hırsızlığıdır.
 */

import { FRESHNESS_THRESHOLDS_MS } from "@/types/data-envelope";

export type OdinModule = keyof typeof FRESHNESS_THRESHOLDS_MS;

export interface QueryPolicy {
  /** Bu süre boyunca veri taze sayılır, yeniden çekilmez. */
  staleTime: number;
  /** Aboneliği kalmayan veri bellekte bu kadar tutulur, sonra atılır. */
  gcTime: number;
  /** Arka plan yenileme aralığı. `false` → yalnız talep üzerine. */
  refetchInterval: number | false;
}

/**
 * `live` eşiği = veri "canlı" sayıldığı süre → aynen `staleTime`.
 *
 * Yenileme aralığı `recent` eşiğidir: veri BAYAT SAYILACAĞI AN tazelenir.
 * (Meclis düzeltmesi: buraya önce "bayatlamadan ÖNCE" yazmıştım, yanlıştı —
 * `refetchInterval` `staleTime`'dan büyük olduğu için arada bir pencere var
 * ve o pencerede veri React Query'ye göre bayat, tazelik damgasına göre
 * "yakın"dır. İnvariant `refetchInterval <= recent eşiği`dir; testi bunu
 * ölçer, açıklama artık ölçtüğü şeyi söylüyor.)
 */
export function policyFor(module: OdinModule): QueryPolicy {
  const t = FRESHNESS_THRESHOLDS_MS[module] ?? FRESHNESS_THRESHOLDS_MS.default;
  return {
    staleTime: t.live,
    gcTime: t.recent * 2,
    refetchInterval: t.recent,
  };
}
