/**
 * Yüzde ölçeği — UI-ADR-093'ün TEK uygulama noktası.
 *
 * "18.1 mi, 0.181 mi?" sorusu tahmin edilmez; bildirilir. Bildirilmemişse
 * değer HİÇ gösterilmez. Yanlış tahmin %18,1 yerine %1810 yazar ve bu, eksik
 * veriden tehlikelidir: makul görünür.
 *
 * NEDEN AYRI DOSYA: aynı 100'e bölme kuralı S6'da dört yerde daha gerekti
 * (KPI kartı · Amazon Glance · PPC Overview · SKU paneli). Dört kopya, bir
 * gün üçünün düzeltilip birinin unutulması demektir.
 */

import type { PercentScale } from "@/types/executive";

export const PERCENT_SCALE_MISSING =
  "Yüzde ölçeği (scale) bildirilmedi — değer gösterilmiyor";

/** `Num format="percent"` 0–1 bekler. Ölçek bilinmiyorsa null. */
export function percentFactor(scale: PercentScale | undefined): number | null {
  if (scale === "0-1") return 1;
  if (scale === "0-100") return 1 / 100;
  return null;
}

/** Ölçek ya da değer yoksa null döner — çağıran NoData basar, 0 basmaz. */
export function toPercentUnit(
  value: number | null | undefined,
  scale: PercentScale | undefined
): number | null {
  const factor = percentFactor(scale);
  if (factor === null) return null;
  return Number.isFinite(value as number) ? (value as number) * factor : null;
}
