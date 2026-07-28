/**
 * ODIN Motion Tokens
 * Kaynak: docs/ui_chatgpt/12-motion-system.md
 *
 * KURAL: Bileşen içinde inline `transition={{ duration: 0.3 }}` YASAK.
 *        Her zaman buradan import edilir.
 *
 * Animasyon YALNIZCA 4 amaç için:
 *   Context Change · Focus · Feedback · State Transition
 * Dekoratif animasyon yoktur.
 */

export const duration = {
  fast: 0.12,    // hover, focus, küçük geri bildirim
  normal: 0.22,  // panel açılma, kart genişleme
  slow: 0.40,    // workspace geçişi, bağlam değişimi
} as const;

export const ease = {
  standard: [0.4, 0, 0.2, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
} as const;

/** Framer Motion transition preset'leri */
export const motion = {
  fast: { duration: duration.fast, ease: ease.standard },
  normal: { duration: duration.normal, ease: ease.standard },
  slow: { duration: duration.slow, ease: ease.standard },
  enter: { duration: duration.normal, ease: ease.enter },
  exit: { duration: duration.fast, ease: ease.exit },
} as const;

/** Workspace geçişi — "sayfa değişimi" değil, "bağlam değişimi" hissi */
export const workspaceTransition = {
  initial: { opacity: 0, scale: 0.995 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.995 },
  transition: motion.slow,
} as const;

/** Panel / drawer açılışı */
export const panelTransition = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
  transition: motion.normal,
} as const;

/** Liste öğesi girişi — yumuşak, dikkat çekmez */
export const listItemTransition = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: motion.normal,
} as const;

export const scaleHover = 1.01;
export const opacityDisabled = 0.4;

/** Reduced motion kontrolü */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Sayı geçişi süresi.
 * 12-motion-system.md §5: sayı ZIPLAMAZ, tween ile geçer.
 */
export const numberTweenDuration = duration.normal;
