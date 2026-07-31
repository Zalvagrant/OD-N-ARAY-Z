/**
 * Stat — etiket · değer · not üçlüsü. Bir kartın içindeki tek ölçüm satırı.
 *
 * NEDEN AYRI BİLEŞEN: aynı üçlü Mission Control'ün Operational Status'ünde
 * ve Amazon Director'ün PPC / BuyBox / Orders özetlerinde geçiyor. İkinci
 * kez yazmak "bileşen tekrarı yasak" kuralının (CLAUDE.md §5) ihlali olurdu.
 * `ExecutiveKPICard` bunun yerini tutmaz: o kart trend · sparkline · forecast
 * · confidence ister; bu satırın arkasında öyle bir veri yok ve olmayanı
 * doldurmak sahte veridir.
 *
 * SAYI HİZASI (S5'te görsel incelemede yakalandı): `.odin-num` sayıları SAĞA
 * hizalar (03-...md §11). Blok bir elemana verilirse sayı etiketinden kopar.
 * Bu yüzden sınıf her zaman SATIR İÇİ bir `span`'dedir.
 *
 * Anti-fake: değer yoksa çağıran `<NoData/>` geçirir — bu bileşen "0" üretmez.
 */

import type { ReactNode } from "react";
import { TONE, type Tone } from "@/components/ui/typography";

const SIZE = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
} as const;

export function Stat({
  label,
  value,
  note,
  tone = "default",
  size = "lg",
}: {
  label: string;
  /** Düz sayı/metin satır içi `odin-num` ile yazılır; düğüm olduğu gibi geçer. */
  value: ReactNode;
  note?: ReactNode;
  tone?: Tone;
  size?: keyof typeof SIZE;
}) {
  const plain = typeof value === "number" || typeof value === "string";

  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-content-tertiary">{label}</dt>
      {/* flex-wrap + gap: bir hücrede birden fazla düğüm olabiliyor
          (Meter + Num, ya da Num + birim). S6'da üç yerde gerekti. */}
      <dd className="mt-1 flex flex-wrap items-baseline gap-2">
        {plain ? (
          <span className={`odin-num ${SIZE[size]} ${TONE[tone]}`}>{value}</span>
        ) : (
          value
        )}
      </dd>
      {note && <p className="text-xs text-content-tertiary">{note}</p>}
    </div>
  );
}
