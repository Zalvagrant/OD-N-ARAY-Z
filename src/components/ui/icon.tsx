/**
 * Icon — Lucide sarmalayıcısı (10-component-library.md §10 Primitives).
 *
 * Amaç: ikon boyutu ve tonu tek yerden gelsin. Bileşenler doğrudan
 * `<Search className="h-4 w-4 text-icon" />` yazarsa ölçek dağılır.
 *
 * Erişilebilirlik: `label` verilmezse ikon dekoratiftir (`aria-hidden`).
 * Anlam taşıyan her ikon `label` almak ZORUNDADIR — renk/şekil tek başına
 * anlam taşıyamaz (§15 kalite kapısı).
 */

import type { LucideIcon } from "lucide-react";

const SIZE = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
} as const;

const TONE = {
  default: "text-icon",
  active: "text-icon-active",
  muted: "text-icon-muted",
  ai: "text-ai",
  danger: "text-danger",
  warning: "text-warning",
  success: "text-success",
  info: "text-info",
} as const;

export type IconSize = keyof typeof SIZE;
export type IconTone = keyof typeof TONE;

export function Icon({
  as: Glyph,
  size = "sm",
  tone = "default",
  label,
  className = "",
}: {
  as: LucideIcon;
  size?: IconSize;
  tone?: IconTone;
  label?: string;
  className?: string;
}) {
  return (
    <Glyph
      className={`shrink-0 ${SIZE[size]} ${TONE[tone]} ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
