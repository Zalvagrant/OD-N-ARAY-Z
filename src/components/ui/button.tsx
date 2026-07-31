"use client";

/**
 * Button — 10-component-library.md §4 (variant), §5 (size), §6 (state)
 *
 * DURUM MODELİ (UI-ADR-086): ortak bir `state` prop'u YOKTUR.
 * Hover/Pressed/Focus CSS pseudo-class'tan, Disabled/ReadOnly native
 * attribute'tan, Loading `aria-busy`'den gelir. Gerekçe: tek `state` prop'u
 * geçersiz kombinasyon üretir (loading + disabled) ve native semantiği bozar.
 *
 * Desteklenmeyen durumlar ve gerekçesi:
 *   Empty     — N/A. Butonun içeriği çağıran tarafından verilir; boş buton
 *               tıklanabilir bir hedef değildir, render EDİLMEZ.
 *   Error /   — N/A prop olarak. Kalıcı anlam `variant` ile taşınır
 *   Success     (danger / success). Geçici "kaydedildi" geri bildirimi
 *               butonun değil, Autosave göstergesinin işidir (§8.11).
 *   ReadOnly  — N/A. Salt okunur bir eylem yoktur; karşılığı `disabled`.
 */

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Loader2, WifiOff } from "lucide-react";

const VARIANT = {
  primary:
    "bg-ai text-content-inverse hover:brightness-110 active:brightness-95",
  secondary:
    "bg-surface-elevated text-content border border-line hover:border-line-active active:bg-surface",
  tertiary:
    "bg-transparent text-content-secondary hover:bg-surface hover:text-content active:bg-surface-elevated",
  ghost:
    "bg-transparent text-icon hover:bg-surface hover:text-icon-active active:bg-surface-elevated",
  danger: "bg-danger text-content-inverse hover:brightness-110 active:brightness-95",
  success:
    "bg-success text-content-inverse hover:brightness-110 active:brightness-95",
  warning:
    "bg-warning text-content-inverse hover:brightness-110 active:brightness-95",
  info: "bg-info text-content-inverse hover:brightness-110 active:brightness-95",
} as const;

const SIZE = {
  xs: "h-6 px-2 text-xs gap-1 rounded-sm",
  sm: "h-8 px-3 text-sm gap-2 rounded-sm",
  md: "h-10 px-4 text-base gap-2 rounded",
  lg: "h-12 px-5 text-md gap-2 rounded-md",
  xl: "h-16 px-6 text-lg gap-3 rounded-md",
} as const;

const ICON_SIZE = {
  xs: "h-3 w-3",
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-4 w-4",
  xl: "h-5 w-5",
} as const;

export type ButtonVariant = keyof typeof VARIANT;
export type ButtonSize = keyof typeof SIZE;

/** İkon butonunda yatay padding kare orana düşer. */
const ICON_ONLY_PAD: Record<ButtonSize, string> = {
  xs: "!px-1",
  sm: "!px-2",
  md: "!px-2",
  lg: "!px-3",
  xl: "!px-4",
};

interface ButtonBase
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Yükleniyor: buton kilitlenir, spinner girer, aria-busy açılır. */
  loading?: boolean;
  /** Bağlantı yok: eylem gerçekleştirilemez, sebebi kullanıcıya söylenir. */
  offline?: boolean;
  /** Metnin solundaki ikon. Lucide bileşeni verilir. */
  icon?: ReactNode;
  children?: ReactNode;
  /**
   * React 19'da `ref` sıradan bir prop'tur, ama TİPİ beyan edilmezse
   * çağıran onu geçiremez. Gerekli: bir açılır paneli kapatan kod odağı
   * tetikleyiciye GERİ VERMEK zorundadır (`filter.tsx`, UI-ADR-141) —
   * yoksa odak silinen düğümde kalır ve sonraki Tab belgenin başına atlar.
   */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * `iconOnly` → `aria-label` DERLEMEDE zorunlu (UI-ADR-141).
 *
 * Burada bir yorum vardı: *"Yalnız ikon — `aria-label` ZORUNLU."* — ve
 * hiçbir şey onu zorlamıyordu. Yorumla korunan bir kural, korunmayan bir
 * kuraldır: adsız bir ikon butonu ekran okuyucuda yalnızca "buton" diye
 * okunur ve ne yaptığı ASLA anlaşılmaz. Görerek fark edilmez; bu yüzden
 * derleyiciye verildi (eslint.config.mjs'in "mimari derleyicide yaşar"
 * ilkesiyle aynı).
 *
 * `aria-labelledby` de kabul edilir: ad görünür bir başlıktan geliyorsa
 * onu tekrar etmek yerine ona bağlanmak DOĞRUSUDUR (bkz. `modal.tsx`).
 */
export type ButtonProps =
  | (ButtonBase & { iconOnly?: false })
  | (ButtonBase & { iconOnly: true; "aria-label": string })
  | (ButtonBase & { iconOnly: true; "aria-labelledby": string });

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  offline = false,
  icon,
  iconOnly = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const locked = disabled || loading || offline;

  return (
    <button
      type="button"
      {...rest}
      disabled={locked}
      aria-busy={loading || undefined}
      title={offline ? "Bağlantı yok — eylem şu an gerçekleştirilemez" : rest.title}
      className={[
        "inline-flex shrink-0 items-center justify-center font-medium",
        "transition-[background-color,border-color,filter,opacity]",
        "duration-fast ease-standard",
        "disabled:cursor-not-allowed disabled:opacity-40",
        iconOnly ? ICON_ONLY_PAD[size] : "",
        SIZE[size],
        VARIANT[variant],
        className,
      ].join(" ")}
    >
      {/* Renkten bağımsız durum göstergesi: hem ikon hem erişilebilir metin */}
      {loading && (
        <>
          <Loader2
            className={`${ICON_SIZE[size]} animate-spin`}
            aria-hidden
          />
          <span className="sr-only">Yükleniyor</span>
        </>
      )}
      {!loading && offline && (
        <>
          <WifiOff className={ICON_SIZE[size]} aria-hidden />
          <span className="sr-only">Bağlantı yok</span>
        </>
      )}
      {!loading && !offline && icon}
      {!iconOnly && children}
    </button>
  );
}
