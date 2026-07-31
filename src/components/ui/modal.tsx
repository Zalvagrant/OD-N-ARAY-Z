"use client";

/**
 * Modal / Drawer — 10-component-library.md §10, 11-design-tokens.md §11
 *
 * Cam YALNIZCA overlay katmanında kullanılır (UI-ADR-069) → `odin-glass-modal`.
 * Perde `odin-overlay-scrim`.
 *
 * Davranış:
 *   - Esc kapatır
 *   - Odak panele girer, panelde HAPSOLUR (Tab döngüsü)
 *   - Kapanınca odak açan öğeye geri döner
 *   - Arka plan kaydırması kilitlenir
 *
 * Giriş animasyonu "Context Change" amacına hizmet eder (12-...md §1) ve
 * `useReducedMotion` ile tamamen kapanabilir. Çıkış animasyonu YOK: kapanma
 * anında beklemek yönetici arayüzünde gecikme hissi üretir.
 *
 * Desteklenmeyen durumlar: Loading / Empty / Error / Success / Offline /
 * ReadOnly — bunlar modalın İÇERİĞİNİN durumudur, kabuğun değil.
 */

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion as fm, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { motion } from "@/animations/motion";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const MODAL_SIZE = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
} as const;

const DRAWER_SIZE = {
  sm: "w-96",
  md: "w-1/3",
  lg: "w-1/2",
} as const;

function useDialogBehavior(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open, onClose]);

  return panelRef;
}

function DialogShell({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  wrapperClass,
  panelClass,
  enter,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
  wrapperClass: string;
  panelClass: string;
  enter: { initial: Record<string, number>; animate: Record<string, number> };
}) {
  const panelRef = useDialogBehavior(open, onClose);
  const reduced = useReducedMotion();
  const titleId = useId();
  const descId = useId();

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`odin-overlay-scrim fixed inset-0 z-50 ${wrapperClass}`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <fm.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        /* AD GÖRÜNÜR BAŞLIKTAN GELİR, tekrar EDİLMEZ — UI-ADR-141.
           Önce `aria-label={title}` vardı ve aşağıdaki `<h2>` aynı metni
           taşıyordu: ekran okuyucu başlığı iki kez okuyor, dahası ad ile
           görünen başlık ayrı ayrı yaşıyordu (biri değişse diğeri
           kalırdı). `aria-labelledby` ikisini TEK kaynağa bağlar. */
        aria-labelledby={titleId}
        /* Açıklama hiçbir şeye bağlı DEĞİLDİ: ekranda duruyor ama diyalog
           açıldığında okunmuyordu — yani yalnız gören kullanıcı için
           vardı. */
        aria-describedby={description ? descId : undefined}
        initial={reduced ? false : enter.initial}
        animate={enter.animate}
        transition={motion.normal}
        className={`odin-glass-modal flex flex-col ${panelClass}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-md font-medium text-content">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-content-secondary">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="shrink-0 rounded-sm p-1 text-icon hover:text-icon-active"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </fm.div>
    </div>,
    document.body
  );
}

export function Modal({
  size = "md",
  ...rest
}: Omit<Parameters<typeof DialogShell>[0], "wrapperClass" | "panelClass" | "enter"> & {
  size?: keyof typeof MODAL_SIZE;
}) {
  return (
    <DialogShell
      {...rest}
      wrapperClass="flex items-start justify-center p-16"
      panelClass={`w-full max-h-full overflow-hidden rounded-lg ${MODAL_SIZE[size]}`}
      enter={{ initial: { opacity: 0, scale: 0.99 }, animate: { opacity: 1, scale: 1 } }}
    />
  );
}

export function Drawer({
  size = "sm",
  ...rest
}: Omit<Parameters<typeof DialogShell>[0], "wrapperClass" | "panelClass" | "enter"> & {
  size?: keyof typeof DRAWER_SIZE;
}) {
  return (
    <DialogShell
      {...rest}
      wrapperClass="flex justify-end"
      panelClass={`h-full max-w-full ${DRAWER_SIZE[size]}`}
      enter={{ initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 } }}
    />
  );
}
