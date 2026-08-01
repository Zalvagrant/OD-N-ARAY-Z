/**
 * Typography System — 11-design-tokens.md §16, UI-ADR-081
 *
 * S3'ün İLK işi. Gerekçe: veri yoğun bir Executive sistemde en çok
 * kullanılan iki şey tipografi ve tablodur.
 *
 * KRİTİK: `Num` bileşeni tabular-nums ve sağa hizayı ZORUNLU kılar.
 * Sütunda hizalanmayan sayı = okunmayan tablo (§16 "kritik not").
 *
 * Anti-fake (CLAUDE.md §2): `Num` değeri null/undefined ise sıfır ya da
 * tire uydurulmaz — NoData bileşenine düşer.
 */

import type { ElementType, ReactNode } from "react";
import type { PercentScale } from "@/types/executive";
import { toPercentUnit } from "@/lib/format/percent";
import { NoData } from "@/components/ui/no-data";

/* --------------------------------------------------------------------------
   Heading — 4 seviye. Görsel ölçek ile semantik seviye ayrılabilir:
   `level` erişilebilirlik hiyerarşisini, `size` görünümü belirler.
   -------------------------------------------------------------------------- */

const HEADING_SIZE = {
  1: "text-3xl font-semibold tracking-tight",
  2: "text-2xl font-semibold tracking-tight",
  3: "text-xl font-semibold",
  4: "text-lg font-medium",
} as const;

export type HeadingLevel = 1 | 2 | 3 | 4;

export function Heading({
  level = 2,
  size,
  className = "",
  children,
}: {
  level?: HeadingLevel;
  size?: HeadingLevel;
  className?: string;
  children: ReactNode;
}) {
  const Tag = `h${level}` as ElementType;
  return (
    <Tag className={`text-content ${HEADING_SIZE[size ?? level]} ${className}`}>
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------------------------
   Text — gövde metni.
   -------------------------------------------------------------------------- */

const TEXT_SIZE = {
  sm: "text-sm",
  base: "text-base",
  md: "text-md",
} as const;

/**
 * METİN TONU — TEK SÖZLÜK (UI-ADR-136).
 *
 * Aynı yedi giriş `ui/stat.tsx`te ikinci kez, `StatTone` adıyla yazılıydı.
 * İki sözlük demek, birine ton eklendiğinde diğerinin sessizce geride
 * kalması demektir. `ui/icon.tsx` ve `ui/timeline.tsx` BİRLEŞTİRİLMEDİ:
 * onlar `text-icon*` / `bg-*` token kümelerine bakar, aynı isimler farklı
 * değerlerdir — benzer görünmek aynı olmak değildir.
 */
export const TONE = {
  default: "text-content",
  secondary: "text-content-secondary",
  tertiary: "text-content-tertiary",
  ai: "text-ai-text",
  danger: "text-danger",
  warning: "text-warning",
  success: "text-success",
} as const;

export type Tone = keyof typeof TONE;

export function Text({
  size = "base",
  tone = "default",
  as: Tag = "p",
  className = "",
  children,
}: {
  size?: keyof typeof TEXT_SIZE;
  tone?: Tone;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`${TEXT_SIZE[size]} ${TONE[tone]} ${className}`}>
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------------------------
   Label — alan etiketi. Küçük, büyük harf, geniş harf aralığı.
   Form dışında da kullanılır (KPI adı, bölüm başlığı).
   -------------------------------------------------------------------------- */

export function Label({
  htmlFor,
  required,
  className = "",
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const cls = `text-xs font-medium uppercase tracking-wide text-content-secondary ${className}`;
  const body = (
    <>
      {children}
      {required && (
        /* Renkten bağımsız gösterge: yıldız işareti + erişilebilir metin */
        <span className="ml-1 text-danger" aria-hidden>
          *
        </span>
      )}
      {required && <span className="sr-only"> (zorunlu)</span>}
    </>
  );
  return htmlFor ? (
    <label htmlFor={htmlFor} className={cls}>
      {body}
    </label>
  ) : (
    <span className={cls}>{body}</span>
  );
}

/* --------------------------------------------------------------------------
   Caption — yardımcı/ikincil açıklama.
   -------------------------------------------------------------------------- */

export function Caption({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`text-xs text-content-tertiary ${className}`}>
      {children}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Num — SAYI. Tek doğru yol.
   tabular-nums + sağa hizalama `.odin-num` sınıfından gelir (tokens.css).
   -------------------------------------------------------------------------- */

export type NumFormat = "plain" | "currency" | "percent" | "compact";

const NUM_SIZE = {
  sm: "text-sm",
  base: "text-base",
  md: "text-md",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
} as const;

export function formatNumber(
  value: number,
  {
    format = "plain",
    currency,
    fractionDigits,
    locale = "tr-TR",
  }: {
    format?: NumFormat;
    currency?: string;
    fractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const options: Intl.NumberFormatOptions = {};
  if (format === "currency") {
    options.style = "currency";
    /* PARA BİRİMİ UYDURULMAZ — UI-ADR-161.
       `?? "TRY"` idi: bildirilmemiş bir para birimi sessizce liraya
       dönüyordu. Dolar bir tutarı lira göstermek, eksik veriden çok daha
       tehlikelidir — sayı makul görünür ve kimse sorgulamaz. Bugünkü
       çağıranların hepsi `Money.currency` geçiyor, ama varsayılan bir
       tuzaktı ve `Num`un kendi anti-fake sözü (satır 10) bunun tersini
       vaat ediyordu. Bildirilmemişse BİRİMSİZ yazılır. */
    if (currency) options.currency = currency;
    else options.style = "decimal";
  } else if (format === "percent") {
    options.style = "percent";
  } else if (format === "compact") {
    options.notation = "compact";
  }
  if (fractionDigits !== undefined) {
    options.minimumFractionDigits = fractionDigits;
    options.maximumFractionDigits = fractionDigits;
  }
  return new Intl.NumberFormat(locale, options).format(value);
}

export function Num({
  value,
  format = "plain",
  currency,
  fractionDigits,
  locale = "tr-TR",
  size = "base",
  tone = "default",
  noDataReason,
  className = "",
}: {
  value: number | null | undefined;
  format?: NumFormat;
  currency?: string;
  fractionDigits?: number;
  locale?: string;
  size?: keyof typeof NUM_SIZE;
  tone?: Tone;
  noDataReason?: string;
  className?: string;
}) {
  /* Anti-fake: hesaplanamayan sayı 0 olarak gösterilmez. */
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <NoData reason={noDataReason} />;
  }
  return (
    <span
      className={`odin-num ${NUM_SIZE[size]} ${TONE[tone]} ${className}`}
      data-numeric="true"
    >
      {formatNumber(value, { format, currency, fractionDigits, locale })}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Pct — YÜZDE. `Num`un üstünde ince bir katman, UI-ADR-138.
   -------------------------------------------------------------------------- */

/**
 * NEDEN AYRI BİLEŞEN: aşağıdaki beş satır ALTI yerde kelimesi kelimesine
 * yazılıydı (ppc-overview · amazon-director · amazon-sku-panel ×3 ·
 * glance-view):
 *
 *     <Num value={toPercentUnit(x, scale)} format="percent" fractionDigits={1} … />
 *
 * `lib/format/percent.ts` ölçek DÖNÜŞÜMÜNÜ zaten tekilleştirmişti; ama
 * ölçekten sonra gelen iki SUNUM KARARI — `format="percent"` ve
 * **bir ondalık** — altı kopyada yaşamaya devam ediyordu. Ondalık sayısı
 * bir gün değişirse altı yerin altısı da bulunmak zorunda; beşi bulunup
 * biri unutulduğunda ekranda %71,5 ile %71 yan yana durur ve hangisinin
 * doğru olduğu anlaşılmaz.
 *
 * Anti-fake KORUNUR: ölçek bildirilmemişse `toPercentUnit` null döner ve
 * `Num` NoData basar — 0 ya da tahmin ASLA basılmaz (UI-ADR-093).
 */
/**
 * PARA — `Pct`'in EKSİK KARDEŞİ (UI-ADR-183, mimari denetim).
 *
 * NEDEN AYRI BİLEŞEN: `Pct` yukarıda "beş satır altı yerde yazılıydı"
 * diye çıkarıldı. Para için AYNI iş yapılmamıştı ve tekrar daha
 * büyüktü — ölçüldü, **on yer** şu üç satırı kelimesi kelimesine
 * yazıyordu:
 *
 *     value={x?.amount ?? null}
 *     format="currency"
 *     currency={x?.currency}
 *
 * (ppc-overview ×3 · glance-view ×3 · amazon/sku ×4)
 *
 * Tekrarın bedeli yalnız hacim değil: her çağıran `Money` zarfını ELLE
 * söküyor. `types/executive.ts`teki `Money` bir gün `amount` yerine
 * `minor` (kuruş) taşırsa on yerin onu da bulunmak zorunda; dokuzu
 * bulunup biri unutulduğunda ekranda 100 kat sapmış bir tutar durur ve
 * hangisinin doğru olduğu anlaşılmaz — `Pct`in gerekçesinin aynısı.
 *
 * Anti-fake KORUNUR: zarf yoksa `null` gider ve `Num` `NoData` basar;
 * para birimi bildirilmemişse `Num` lira UYDURMAZ (UI-ADR-161).
 */
export function Money({
  value,
  ...rest
}: {
  /** ODIN'in para zarfı — sökme işi burada, çağıranda değil. */
  value: { amount: number | null; currency?: string } | null | undefined;
} & Omit<Parameters<typeof Num>[0], "value" | "format" | "currency">) {
  return (
    <Num
      value={value?.amount ?? null}
      format="currency"
      currency={value?.currency}
      {...rest}
    />
  );
}

export function Pct({
  value,
  scale,
  fractionDigits = 1,
  ...rest
}: {
  /** HAM değer — ölçek dönüşümü burada yapılır, çağıranda değil. */
  value: number | null | undefined;
  scale: PercentScale | undefined;
  fractionDigits?: number;
} & Omit<Parameters<typeof Num>[0], "value" | "format" | "fractionDigits">) {
  return (
    <Num
      value={toPercentUnit(value, scale)}
      format="percent"
      fractionDigits={fractionDigits}
      {...rest}
    />
  );
}

/* --------------------------------------------------------------------------
   Mono — SKU, ID, kod. Asla gövde metni için kullanılmaz.
   -------------------------------------------------------------------------- */

export function Mono({
  size = "sm",
  tone = "secondary",
  className = "",
  children,
}: {
  size?: keyof typeof TEXT_SIZE;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`odin-mono ${TEXT_SIZE[size]} ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}
