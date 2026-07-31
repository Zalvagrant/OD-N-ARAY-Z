"use client";

/**
 * Card — Data Display'in taşıyıcı yüzeyi (10-component-library.md §10).
 *
 * Kompozisyon: Card > CardHeader / CardBody / CardFooter.
 * Kart kendi verisini çekmez, kendi iş mantığını taşımaz (§13 kuralı).
 *
 * Desteklenmeyen durumlar:
 *   Hover / Pressed — yalnızca `interactive` iken. Tıklanamayan bir yüzeyin
 *                     hover tepkisi vermesi yanlış afordans üretir.
 *   ReadOnly        — N/A. Kart zaten salt görüntüdür.
 *   Loading/Empty/Error — kartın İÇERİĞİ tarafından temsil edilir
 *                     (Skeleton / EmptyState / ErrorState), kartın kendisi
 *                     tarafından değil. Tek bir "kart hatası" görünümü
 *                     içerik türünü gizlerdi.
 */

import type { ReactNode } from "react";

const TONE = {
  default: "bg-surface border border-line shadow-e1",
  elevated: "bg-surface-elevated border border-line-subtle shadow-e2",
  /* AI bölgesi — UI-ADR-069 hibrit kuralı: mor glow yalnızca AI üretiminde */
  ai: "odin-ai-region",
} as const;

const PAD = {
  comfortable: "p-6",
  compact: "p-4",
  dense: "p-3",
} as const;

export type CardTone = keyof typeof TONE;
export type Density = keyof typeof PAD;

export function Card({
  tone = "default",
  density = "comfortable",
  interactive = false,
  className = "",
  children,
  ...rest
}: {
  tone?: CardTone;
  density?: Density;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      data-density={density}
      className={[
        "rounded-md",
        TONE[tone],
        /* SAHTE AFFORDANCE DEĞİL — UI-ADR-132.
           `interactive` yalnızca hover/geçiş görünümünü açar. Tıklama ve
           klavye yolu `Pressable` ile SARARAK verilir; burada `tabIndex`
           uydurmayız çünkü Card'ın kendisi bir düğme değildir.
           Önceden buraya `focus-visible:` sınıfı yazılıydı ve düz bir
           `<div>` odaklanamadığı için HİÇ eşleşmiyordu. */
        interactive
          ? "cursor-pointer transition-colors duration-fast ease-standard hover:border-line-active"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  density = "comfortable",
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  density?: Density;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-line-subtle ${PAD[density]} pb-3`}
    >
      <div className="min-w-0">
        {/* Başlık KIRPILMAZ, sarar. `truncate` idi ve uzun bir başlığın
            SONUNU yiyordu: "Gross Profit (ücretler hariç)" → "…(ücretler
            hariç" — yani kartın dürüstlüğünü taşıyan parantez kayboluyordu
            (S6 görsel incelemesi, 1280 ve 1920'de ölçüldü). Kısa başlıklarda
            davranış değişmez; uzun olan ikinci satıra iner. */}
        {title && (
          <div className="break-words text-md font-medium text-content">{title}</div>
        )}
        {description && (
          <div className="mt-1 text-sm text-content-secondary">{description}</div>
        )}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({
  density = "comfortable",
  className = "",
  children,
}: {
  density?: Density;
  className?: string;
  children: ReactNode;
}) {
  return <div className={`${PAD[density]} ${className}`}>{children}</div>;
}

export function CardFooter({
  density = "comfortable",
  className = "",
  children,
}: {
  density?: Density;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-end gap-2 border-t border-line-subtle ${PAD[density]} pt-3 ${className}`}
    >
      {children}
    </div>
  );
}
