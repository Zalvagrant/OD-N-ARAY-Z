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

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
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

/**
 * AÇIK DİYALOG YIĞINI — UI-ADR-156.
 *
 * İki kusur birden vardı ve ikisi de `document` üstündeki CAPTURE
 * dinleyicisinden geliyordu:
 *
 *  1. **İç içe diyalogda Escape İKİSİNİ BİRDEN kapatıyordu.** Her diyalog
 *     dinleyicisini AYNI düğüme (`document`) ekliyor; `stopPropagation()`
 *     aynı düğümdeki diğer dinleyiciyi DURDURMAZ (onun için
 *     `stopImmediatePropagation` gerekir). Drawer içinden onay Modal'ı
 *     açıp Escape'e basmak ikisini birden kapatıyordu.
 *
 *  2. **İçerideki Escape'ler HİÇ çalışmıyordu.** Capture fazı hedeften
 *     ÖNCE koştuğu için `table`/`search`/`filter`ın kendi Escape'leri
 *     modal içinde hiç devreye giremiyordu: modal önce kapanıyordu.
 *
 * Çözüm iki parça: (a) yığın — yalnız EN ÜSTTEKİ diyalog Escape'e cevap
 * verir; (b) KABARMA fazı — içerideki bileşen önce görür ve isterse
 * `stopPropagation` ile sahiplenir. "En içteki açık şey kapanır" kuralı
 * kullanıcının beklediği davranıştır.
 */
/**
 * İç içelik DERİNLİĞİ — effect sırası DEĞİL.
 *
 * İlk çözüm bir dizi kullanıp "son eklenen en üsttedir" varsaydı ve
 * YANLIŞTI: React çocuk effect'lerini EBEVEYNDEN ÖNCE koşturur, yani
 * içteki modal önce, dıştaki drawer sonra ekleniyordu — dizinin sonundaki
 * DIŞTAKİ oluyordu ve Escape onu kapatıp içindekini de götürüyordu.
 * Test bunu yakaladı (beklenen 1 diyalog, kalan 0).
 *
 * Derinlik context ile taşınır: her diyalog çocuklarına `depth + 1` verir.
 * En içteki, DERİNLİĞİ EN BÜYÜK olandır — bu, mount sırasından ve DOM
 * portal sırasından bağımsızdır.
 */
const DialogDepth = createContext(0);

/**
 * AÇIK DİYALOG YIĞINI — kimlik DERİNLİK DEĞİL (UI-ADR-164).
 *
 * UI-ADR-157 kimliği iç içelik derinliği yapmıştı ve o, mount sırasına
 * dayanan ilk çözümden iyiydi — ama YETMİYORDU: **aynı derinlikte iki
 * diyalog ayırt edilemiyor.** Bu teorik değil; UI-ADR-159 `command-palette`i
 * bu hook'a bağladı ve palet `app-shell`de ekran içeriğinin KARDEŞİ olarak
 * mount ediliyor → derinliği 1. Ekran seviyesindeki her `Modal`/`Drawer`
 * da 1.
 *
 * Sonuç: onay modalı açıkken Ctrl+K ile palet açılıp Escape'e basılınca
 * İKİSİ BİRDEN kapanıyordu — UI-ADR-157'nin düzelttiğini iddia ettiği
 * davranışın ta kendisi. Ve gövde kaydırma kilidi `Set<number>` olduğu
 * için sızıyordu: ikinci diyalogun `add(1)`i no-op, ilkinin kapanışındaki
 * `delete(1)` kümeyi boşaltıp kilidi diğeri hâlâ açıkken serbest
 * bırakıyordu.
 *
 * Artık her diyalog BENZERSİZ bir token alır; sıralama derinliğe, eşitlik
 * hâlinde ekleme sırasına göre yapılır. Kilit de yığın gerçekten
 * boşalınca ve İLK kaydedilen değerle geri yazılır.
 */
type AcikDiyalog = { token: number; depth: number };
const acikDiyaloglar: AcikDiyalog[] = [];
let dialogSeq = 0;
let ilkOverflow: string | null = null;

/** En içteki: en büyük derinlik; eşitlikte EN SON açılan. */
function enIcteki(): AcikDiyalog | undefined {
  return acikDiyaloglar.reduce<AcikDiyalog | undefined>(
    (best, d) => (best === undefined || d.depth >= best.depth ? d : best),
    undefined
  );
}

/** Bir diyalogun iç içelik derinliği — çağıran bunu `useDialogBehavior`e verir. */
export const useDialogDepth = () => useContext(DialogDepth) + 1;

/**
 * DIŞARI AÇILDI — UI-ADR-159. `command-palette` `aria-modal="true"` diyor
 * ama odak tuzağı, kaydırma kilidi ve odak geri verme YOKTU; üçü de
 * burada zaten yazılı. İkinci kez yazmak, ikisinin bir gün ayrışması
 * demekti (CLAUDE.md §5).
 */
export function useDialogBehavior(
  open: boolean,
  onClose: () => void,
  depth: number
) {
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * `onClose` REF'TE — UI-ADR-163.
   *
   * Bağımlılıkta olduğu için, çağıran satır içi ok fonksiyonu verdiğinde
   * (`onClose={() => setOpen(false)}` — en yaygın biçim) HER ebeveyn
   * render'ında effect sökülüp yeniden kuruluyordu: `opener?.focus()`
   * odağı tetikleyiciye atıyor, sonra panelin ilk öğesine (Kapat butonu)
   * geri alıyordu. Modal içinde bir form varsa ve her tuş vuruşu ebeveyn
   * state'ini güncelliyorsa odak sürekli Kapat butonuna sıçrıyordu.
   *
   * Ref'e effect İÇİNDE yazılır — render'da yazmak `react-hooks/refs`
   * ihlalidir (UI-ADR-157'de öğrenildi).
   */
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const token = ++dialogSeq;
    acikDiyaloglar.push({ token, depth });

    const opener = document.activeElement as HTMLElement | null;
    /* İLK diyalog gövde kaydırmasının ÖZGÜN değerini saklar; sonrakiler
       zaten "hidden" görür ve onu saklarsa geri yazma bozulur. */
    if (acikDiyaloglar.length === 1) ilkOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        /* Yalnız EN İÇTEKİ diyalog kapanır — kimlik TOKEN, derinlik değil. */
        if (enIcteki()?.token !== token) return;
        closeRef.current();
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

    /* Tab tuzağı capture ister (odak taşınmadan önce yakalanmalı),
       Escape ise KABARMA — içerideki bileşen önce sahiplenebilsin. */
    const onTab = (e: KeyboardEvent) => {
      if (e.key === "Tab") onKey(e);
    };
    document.addEventListener("keydown", onTab, true);
    document.addEventListener("keydown", onKey, false);
    return () => {
      document.removeEventListener("keydown", onTab, true);
      document.removeEventListener("keydown", onKey, false);
      const i = acikDiyaloglar.findIndex((d) => d.token === token);
      if (i >= 0) acikDiyaloglar.splice(i, 1);
      /* Gövde kaydırması yalnız SON diyalog kapanınca ve İLK kaydedilen
         değerle serbest kalır. Yanlış sırada unmount olsa bile kilit ne
         sızar ne de kalıcı takılır. */
      if (acikDiyaloglar.length === 0) {
        document.body.style.overflow = ilkOverflow ?? "";
        ilkOverflow = null;
      }
      opener?.focus();
    };
  }, [open, depth]);

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
  const depth = useDialogDepth();
  const panelRef = useDialogBehavior(open, onClose, depth);
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
        /* AD GÖRÜNÜR BAŞLIKTAN GELİR, tekrar EDİLMEZ — UI-ADR-149.
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <DialogDepth.Provider value={depth}>{children}</DialogDepth.Provider>
        </div>

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
