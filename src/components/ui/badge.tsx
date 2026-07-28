/**
 * Badge — durum etiketi (10-component-library.md §10 Primitives).
 *
 * KURAL: renk tek başına anlam taşıyamaz (§15). Bu yüzden her varyantın
 * bir GLYPH'i vardır; renk körü bir kullanıcı da durumu okuyabilir.
 *
 * Desteklenmeyen durumlar: Hover / Pressed / Focus / Disabled / ReadOnly —
 * Badge etkileşimli değildir, salt göstergedir. Tıklanabilir bir etiket
 * gerekiyorsa `Button variant="tertiary" size="xs"` kullanılır.
 */

import type { ReactNode } from "react";

const VARIANT = {
  primary: { cls: "bg-ai-surface text-ai-text border-ai-border", glyph: "●" },
  secondary: {
    cls: "bg-surface-elevated text-content-secondary border-line",
    glyph: "●",
  },
  tertiary: {
    cls: "bg-transparent text-content-tertiary border-line-subtle",
    glyph: "○",
  },
  ghost: { cls: "bg-transparent text-content-tertiary border-transparent", glyph: "" },
  danger: { cls: "bg-danger-bg text-danger border-danger", glyph: "▲" },
  warning: { cls: "bg-warning-bg text-warning border-warning", glyph: "▲" },
  success: { cls: "bg-success-bg text-success border-success", glyph: "✓" },
  info: { cls: "bg-info-bg text-info border-info", glyph: "i" },
} as const;

const SIZE = {
  xs: "h-4 px-1 text-xs gap-1",
  sm: "h-5 px-2 text-xs gap-1",
  md: "h-6 px-2 text-sm gap-1",
} as const;

export type BadgeVariant = keyof typeof VARIANT;

export function Badge({
  variant = "secondary",
  size = "sm",
  showGlyph = true,
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  size?: keyof typeof SIZE;
  /** Glyph yalnızca metin zaten durumu açıkça söylüyorsa kapatılabilir. */
  showGlyph?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const v = VARIANT[variant];
  return (
    <span
      className={`inline-flex items-center rounded-sm border font-medium ${SIZE[size]} ${v.cls} ${className}`}
    >
      {showGlyph && v.glyph && (
        <span aria-hidden className="leading-none">
          {v.glyph}
        </span>
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}
