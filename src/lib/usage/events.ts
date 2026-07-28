/**
 * Kullanım olayı kaydı — UI-ADR-082.
 *
 * Adaptive UI v1.0'da KAPALIDIR. Ama olaylar şimdiden kaydedilir ki v1.1'de
 * açıldığında sistem sıfırdan öğrenmeye başlamasın.
 *
 * Bu dosya yalnızca YAZAR. Hiçbir yerde okunup arayüzü değiştirmez —
 * özellik açık değildir.
 */

const STORAGE_KEY = "odin.usage";
const MAX_EVENTS = 2000;

export interface UsageEvent {
  workspaceId: string;
  /** ISO 8601 */
  enteredAt: string;
  /** Yerel saat (0-23) — "sabahları Finance ile başlıyorsun" için */
  hour: number;
  durationMs: number;
}

function read(): UsageEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UsageEvent[]) : [];
  } catch {
    return [];
  }
}

export function recordWorkspaceVisit(
  workspaceId: string,
  enteredAt: Date,
  durationMs: number
): void {
  if (typeof window === "undefined") return;
  /* Sekme değiştirip hemen dönen kullanıcı sinyal değildir. */
  if (durationMs < 1000) return;

  const event: UsageEvent = {
    workspaceId,
    enteredAt: enteredAt.toISOString(),
    hour: enteredAt.getHours(),
    durationMs,
  };

  try {
    // ponytail: tüm listeyi okuyup yazıyoruz; olay sayısı MAX_EVENTS ile
    // sınırlı olduğu için yeterli. Hacim büyürse IndexedDB'ye taşınır.
    const events = [...read(), event].slice(-MAX_EVENTS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    /* storage kapalıysa sessizce vazgeç — kullanıcı akışını bozmaz */
  }
}

export function readUsageEvents(): UsageEvent[] {
  if (typeof window === "undefined") return [];
  return read();
}
