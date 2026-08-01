"use client";

/**
 * Selection Family — 10-component-library.md §8.7
 * Checkbox · Radio · Toggle · SegmentedControl
 *
 * Ortak seçim mantığı: native input/ARIA semantiği + aynı odak halkası +
 * aynı disabled/readOnly davranışı. Ortak bir "selection state machine"
 * soyutlaması YAZILMADI (UI-ADR-086) — dört bileşenin de doğal HTML
 * karşılığı zaten var; sarmalamak semantiği bozardı.
 *
 * Renkten bağımsızlık: seçili durum yalnızca renkle değil, ŞEKİLLE de
 * gösterilir (tik işareti, dolu nokta, kaydırılmış tutamak).
 */

import { useRef, useEffect, type ReactNode } from "react";
import { Check, Minus } from "lucide-react";

/* ── Checkbox ───────────────────────────────────────────────────────────── */

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  disabled,
  readOnly,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  /* indeterminate yalnızca DOM property'sidir, attribute değildir. */
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      className={`inline-flex items-center gap-2 text-base text-content ${
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      }`}
    >
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-readonly={readOnly || undefined}
          onChange={(e) => !readOnly && onChange(e.target.checked)}
          className="peer h-4 w-4 appearance-none rounded-xs border border-line bg-surface checked:border-ai checked:bg-ai indeterminate:border-ai indeterminate:bg-ai disabled:cursor-not-allowed"
        />
        {(checked || indeterminate) && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-content-inverse">
            {indeterminate ? (
              <Minus className="h-3 w-3" aria-hidden />
            ) : (
              <Check className="h-3 w-3" aria-hidden />
            )}
          </span>
        )}
      </span>
      {label}
    </label>
  );
}

/* ── Radio ─────────────────────────────────────────────────────────────── */

export function RadioGroup<T extends string>({
  name,
  value,
  onChange,
  options,
  disabled,
  legend,
}: {
  name: string;
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  disabled?: boolean;
  legend: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`inline-flex items-center gap-2 text-base text-content ${
            disabled || opt.disabled
              ? "cursor-not-allowed opacity-40"
              : "cursor-pointer"
          }`}
        >
          <span className="relative inline-flex h-4 w-4 shrink-0">
            <input
              type="radio"
              name={name}
              checked={value === opt.value}
              disabled={disabled || opt.disabled}
              onChange={() => onChange(opt.value)}
              className="h-4 w-4 appearance-none rounded-full border border-line bg-surface checked:border-ai"
            />
            {value === opt.value && (
              <span
                className="pointer-events-none absolute inset-1 rounded-full bg-ai"
                aria-hidden
              />
            )}
          </span>
          {opt.label}
        </label>
      ))}
    </fieldset>
  );
}

/* ── Toggle ────────────────────────────────────────────────────────────── */

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  readOnly,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label
      className={`inline-flex items-center gap-3 text-base text-content ${
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-readonly={readOnly || undefined}
        disabled={disabled}
        onClick={() => !readOnly && onChange(!checked)}
        className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border transition-colors duration-fast ease-standard ${
          checked ? "border-ai bg-ai" : "border-line bg-surface-elevated"
        }`}
      >
        {/* Tutamağın konumu şekil bilgisidir — renk körü kullanıcı da okur. */}
        <span
          className={`h-3 w-3 rounded-full bg-content transition-transform duration-fast ease-standard ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
          aria-hidden
        />
      </button>
      <span>{label}</span>
    </label>
  );
}

/* ── SegmentedControl ──────────────────────────────────────────────────── */

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "sm",
  disabled,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  size?: "xs" | "sm" | "md";
  disabled?: boolean;
}) {
  const height = { xs: "h-6", sm: "h-8", md: "h-10" }[size];
  const text = { xs: "text-xs", sm: "text-sm", md: "text-base" }[size];

  /**
   * ODAK SEÇİMİ TAKİP EDER — UI-ADR-160.
   *
   * `move()` yalnız `onChange` çağırıyordu; odak eski butonda kalıyor ve
   * o buton `tabIndex={-1}`e düşüyordu. WAI-ARIA radyo grubu kalıbı
   * odağın seçimle birlikte taşınmasını ister — taşınmazsa ekran okuyucu
   * seçim değişimini DUYURMAZ ve kullanıcı neyi seçtiğini bilmez.
   * (`ui/tabs.tsx` bunu zaten doğru yapıyor.)
   */
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value);
    const nextIndex = (i + dir + options.length) % options.length;
    const next = options[nextIndex];
    if (!next) return;
    onChange(next.value);
    btnRefs.current[nextIndex]?.focus();
  };

  /**
   * HİÇBİRİ EŞLEŞMEZSE İLK BUTON ODAKLANABİLİR KALIR — UI-ADR-160.
   *
   * `tabIndex={active ? 0 : -1}` idi: `value` hiçbir seçenekle
   * eşleşmediğinde (örn. URL'den gelen "7g", seçenekler ["24s","30g"])
   * TÜM butonlar -1 oluyordu ve kontrole Tab'la ULAŞILAMIYORDU. Bir
   * kontrolün klavyeden tamamen kaybolması, görünür olduğu hâlde
   * kullanılamaz olmasıdır.
   */
  const aktifIndex = options.findIndex((o) => o.value === value);
  const odakIndex = aktifIndex >= 0 ? aktifIndex : 0;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        }
      }}
      className={`inline-flex ${height} items-center gap-1 rounded-sm border border-line bg-surface p-1 ${
        disabled ? "pointer-events-none opacity-40" : ""
      }`}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={i === odakIndex ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`h-full rounded-xs px-3 ${text} transition-colors duration-fast ease-standard ${
              active
                ? "bg-surface-elevated font-medium text-content"
                : "text-content-secondary hover:text-content"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
