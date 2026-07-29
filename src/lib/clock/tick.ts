/**
 * ODIN Merkezi Saat — UI-ADR-089
 *
 * NEDEN TEK STORE: Ekranda 20 Director kartı olabilir. Her kart kendi
 * setInterval'ini kurarsa 20 timer, 20 ayrı drift ve gereksiz render olur.
 * Tek bir tick yayını hepsini besler.
 *
 * NEDEN `now` BAŞLANGIÇTA null: Sunucuda `Date.now()` çağrılırsa istemcideki
 * ilk render'da farklı bir değer çıkar → hydration mismatch. Sunucu anlık
 * görüntüsü daima `null`'dır; gerçek zaman ancak mount'tan sonraki ilk
 * tick'te gelir. `now === null` iken canlılık "bilinmiyor"dur — asla
 * "offline" ya da "canlı" diye gösterilmez (anti-fake).
 */

import { useSyncExternalStore } from "react";

/* ponytail: sabit 1 sn tick. Saniye altı hassasiyet gerekirse parametreleşir. */
const TICK_MS = 1000;

let now: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === null) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * Paylaşılan "şimdi". Hiçbir abone kalmayınca timer kendiliğinden durur.
 * SSR ve ilk hydration render'ında `null` döner.
 */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null
  );
}

/* --------------------------------------------------------------------------
   SAF MANTIK — bileşenden bağımsız, test edilebilir
   -------------------------------------------------------------------------- */

/** `unknown` = veri ya da saat yok. Sahte "canlı"/"offline" üretilmez. */
export type Liveness = "unknown" | "live" | "offline";

/**
 * 09-data-contracts.md §4 anti-fake kuralı:
 * lastBeat, beatIntervalMs * 3'ten eskiyse kart offline'a düşer.
 */
export function liveness(
  lastBeat: string | null | undefined,
  beatIntervalMs: number,
  nowMs: number | null
): Liveness {
  if (nowMs === null) return "unknown";
  if (!lastBeat) return "unknown";
  if (!Number.isFinite(beatIntervalMs) || beatIntervalMs <= 0) return "unknown";
  const beat = new Date(lastBeat).getTime();
  if (!Number.isFinite(beat)) return "unknown";
  return nowMs - beat > beatIntervalMs * 3 ? "offline" : "live";
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "2 dk önce". Zaman damgası ya da saat yoksa `null` döner —
 * çağıran bunu hiç yazmaz ("az önce" UYDURULMAZ).
 */
export function relativeTime(
  iso: string | null | undefined,
  nowMs: number | null
): string | null {
  if (nowMs === null || !iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;

  const diff = nowMs - t;
  if (diff < 0) return "birazdan";
  if (diff < MINUTE) return "az önce";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} dk önce`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} sa önce`;
  return `${Math.floor(diff / DAY)} gün önce`;
}

/**
 * "9 gün kaldı" — GELECEK bir tarih için kalan süre.
 *
 * `relativeTime` bir YAŞ fonksiyonudur; gelecek bir tarihte "birazdan" der.
 * Bir terminde bu yanlıştır: 46 gün sonraki termin de "birazdan" görünür.
 * Termin ile yaş farklı sorulardır, ayrı fonksiyonlarla cevaplanır.
 *
 * Geçmiş bir termin gecikmedir ve öyle yazılır. Zaman ya da damga yoksa
 * `null` döner — çağıran hiçbir şey yazmaz.
 */
export function remainingTime(
  iso: string | null | undefined,
  nowMs: number | null
): string | null {
  if (nowMs === null || !iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;

  const diff = t - nowMs;
  if (diff < 0) {
    const late = -diff;
    if (late < HOUR) return "süresi doldu";
    if (late < DAY) return `${Math.floor(late / HOUR)} sa gecikti`;
    return `${Math.floor(late / DAY)} gün gecikti`;
  }
  if (diff < HOUR) return `${Math.max(1, Math.floor(diff / MINUTE))} dk kaldı`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} sa kaldı`;
  return `${Math.floor(diff / DAY)} gün kaldı`;
}
