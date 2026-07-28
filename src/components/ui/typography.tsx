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

const TONE = {
  default: "text-content",
  secondary: "text-content-secondary",
  tertiary: "text-content-tertiary",
  ai: "text-ai-text",
  danger: "text-danger",
  warning: "text-warning",
  success: "text-success",
} as const;

export type TextTone = keyof typeof TONE;

export function Text({
  size = "base",
  tone = "default",
  as: Tag = "p",
  className = "",
  children,
}: {
  size?: keyof typeof TEXT_SIZE;
  tone?: TextTone;
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
    options.currency = currency ?? "TRY";
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
  tone?: TextTone;
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
   Mono — SKU, ID, kod. Asla gövde metni için kullanılmaz.
   -------------------------------------------------------------------------- */

export function Mono({
  size = "sm",
  tone = "secondary",
  className = "",
  children,
}: {
  size?: keyof typeof TEXT_SIZE;
  tone?: TextTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`odin-mono ${TEXT_SIZE[size]} ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}
