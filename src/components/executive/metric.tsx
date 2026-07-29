/**
 * Metric — etiket · değer · not üçlüsü.
 *
 * Executive katmanının iç yardımcısıdır (10b §0.3), envantere girmez.
 * S6'da üç yerde aynı üçlü gerekti: Amazon Executive Glance · PPC Overview ·
 * SKU bağlam paneli. Üç kopya, bir gün birinin hizasının bozulması demektir.
 *
 * `odin-num` sınıfı sayıları SAĞA hizalar (03-...md §11); bu yüzden değer
 * asla blok elemana verilmez, satır içi kalır — S5 görsel incelemesinde
 * yakalanan hatanın kök nedeni buydu.
 */

import type { ReactNode } from "react";

export function Metric({
  label,
  children,
  note,
}: {
  label: string;
  /** Değer — genelde `Num`, `NoData` ya da `Meter`. */
  children: ReactNode;
  /** Değerin altına düşen tek satırlık açıklama. */
  note?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-content-tertiary">
        {label}
      </dt>
      <dd className="mt-1 flex flex-wrap items-baseline gap-2">{children}</dd>
      {note && <p className="mt-0.5 text-xs text-content-tertiary">{note}</p>}
    </div>
  );
}
