"use client";

/**
 * Input ailesi — 10-component-library.md §8.4, §8.8, §8.9
 *
 * Variant: default · inline (tablo içi düzenleme)
 *   Read Only ve Disabled variant DEĞİL, native attribute'tur (UI-ADR-086).
 *   Search ve Filter AYRI primitive'dir (§8.5, §8.6) — burada yoktur.
 *
 * Density: comfortable · compact · dense (§8.8). Dense tablo içi içindir.
 *
 * Klavye (§8.9): Tab · Shift+Tab · Esc · Enter — native davranış korunur,
 * hiçbiri ezilmez.
 */

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export type InputDensity = "comfortable" | "compact" | "dense";
export type InputVariant = "default" | "inline";

const DENSITY: Record<InputDensity, string> = {
  comfortable: "h-10 px-3 text-base",
  compact: "h-8 px-2 text-sm",
  dense: "h-6 px-1 text-sm",
};

const BASE = [
  "w-full bg-surface text-content placeholder:text-content-tertiary",
  "transition-colors duration-fast ease-standard",
  "disabled:cursor-not-allowed disabled:opacity-40",
  "read-only:bg-bg-secondary read-only:text-content-secondary",
  "aria-[invalid=true]:border-danger",
].join(" ");

const VARIANT: Record<InputVariant, string> = {
  default: "rounded-sm border border-line hover:border-line-active",
  /* Inline: çerçeve yalnızca hover/odakta belirir — tablo hücresi içinde
     onlarca kutu çizgisi görsel gürültü üretir. */
  inline: "rounded-sm border border-transparent hover:border-line bg-transparent",
};

export function Input({
  variant = "default",
  density = "comfortable",
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  variant?: InputVariant;
  density?: InputDensity;
}) {
  return (
    <input
      {...rest}
      className={`${BASE} ${VARIANT[variant]} ${DENSITY[density]} ${
        rest.type === "number" ? "odin-num" : ""
      } ${className}`}
    />
  );
}

export function Textarea({
  density = "comfortable",
  rows = 4,
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { density?: InputDensity }) {
  /* Yükseklik satır sayısıyla gelir; DENSITY'nin h-* sınıfı uygulanmaz. */
  const pad = density === "dense" ? "px-1 py-1 text-sm" : "px-3 py-2 text-base";
  return (
    <textarea
      {...rest}
      rows={rows}
      className={`${BASE} ${VARIANT.default} ${pad} resize-y ${className}`}
    />
  );
}

export function Select({
  density = "comfortable",
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { density?: InputDensity }) {
  return (
    <select
      {...rest}
      className={`${BASE} ${VARIANT.default} ${DENSITY[density]} ${className}`}
    >
      {children}
    </select>
  );
}
