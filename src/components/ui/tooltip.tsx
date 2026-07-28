"use client";

/**
 * Tooltip — 10-component-library.md §10 Primitives.
 *
 * Kütüphane kullanılmadı: hover + focus-within CSS ile çözülüyor, JS
 * konumlandırma katmanı bu kapsam için gereksiz maliyettir.
 *
 * KURAL (02-design-principles.md, S12 hazırlığı): tooltip'te YALNIZCA
 * yardımcı bilgi bulunur. Hover'a bağımlı zorunlu bilgi olamaz — dokunmatik
 * cihazda hover yoktur.
 *
 * Erişilebilirlik: içerik `aria-describedby` ile tetikleyiciye bağlanır,
 * bu yüzden klavye odağında da okunur.
 *
 * Desteklenmeyen durumlar: Loading / Empty / Error / Success / Offline /
 * ReadOnly / Disabled — Tooltip bir durum taşıyıcısı değil, açıklama
 * katmanıdır. İçerik yoksa hiç render edilmez.
 */

import { cloneElement, useId, type ReactElement } from "react";

const SIDE = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
} as const;

export function Tooltip({
  content,
  side = "top",
  children,
}: {
  content: React.ReactNode;
  side?: keyof typeof SIDE;
  children: ReactElement<{ "aria-describedby"?: string }>;
}) {
  const id = useId();

  if (!content) return children;

  return (
    <span className="group relative inline-flex">
      {cloneElement(children, { "aria-describedby": id })}
      <span
        id={id}
        role="tooltip"
        className={[
          "pointer-events-none absolute z-50 w-max max-w-xs",
          "rounded-sm bg-surface-floating px-2 py-1 text-xs text-content",
          "shadow-e3 opacity-0 transition-opacity duration-fast ease-standard",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          SIDE[side],
        ].join(" ")}
      >
        {content}
      </span>
    </span>
  );
}
