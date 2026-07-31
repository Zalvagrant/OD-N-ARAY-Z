"use client";

/**
 * Blok içerik saran TIKLANABİLİR bölge — UI-ADR-132.
 *
 * NEDEN VAR: üç yerde aynı erişilebilirlik sözleşmesi vardı ve üçünde de
 * yanlıştı.
 *
 *   · `alert-stack.tsx` ve `timeline.tsx` bir `<button>`ın İÇİNE blok
 *     içerik koyuyordu (`<p>`, `<div>`). `<button>`ın içerik modeli
 *     "phrasing content"tir; `<div>`/`<p>` flow content'tir. Geçersiz
 *     iç içelik: ekran okuyucu düğmenin erişilebilir adını bütün alt
 *     metinleri birleştirerek üretir ve tek nefeslik bir cümle okur.
 *
 *   · `Card interactive` ise TAM TERSİ hatayı yapıyordu: düz bir `<div>`e
 *     `cursor-pointer` ve `focus-visible:` sınıfı veriyordu ama
 *     `tabIndex`, `role` ve klavye işleyicisi YOKTU. `<div>` odaklanabilir
 *     olmadığı için `:focus-visible` HİÇBİR ZAMAN eşleşmiyordu ve
 *     `tokens.css`teki genel odak kuralı `[tabindex]` aradığı için o da
 *     uygulanmıyordu. Fare kullanıcısı el imleci görüyor, klavye
 *     kullanıcısı öğeye hiç ULAŞAMIYORDU.
 *
 * Doğru desen `role="button"` + `tabIndex` + Enter/Space: blok içerik
 * serbest kalır, klavye yolu gerçekten açılır.
 *
 * Space'in `preventDefault`i ZORUNLU — yoksa tuş sayfayı kaydırır ve
 * kullanıcı öğeyi seçerken ekran altına kayar.
 */

import type { KeyboardEvent, ReactNode } from "react";

export function Pressable({
  onPress,
  label,
  className = "",
  children,
}: {
  onPress: () => void;
  /**
   * Erişilebilir ad. Blok içerikte ZORUNLU: aksi hâlde ad bütün alt
   * metinlerin birleşiminden üretilir ve okunamaz uzunlukta olur.
   */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onPress();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onPress}
      onKeyDown={onKeyDown}
      className={`cursor-pointer rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus ${className}`}
    >
      {children}
    </div>
  );
}
