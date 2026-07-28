/**
 * Director durum noktası — 04-navigation-system.md §6
 *
 * ANTI-FAKE: Bu bileşen veri YOKSA hiçbir şey çizmez (null döner).
 * S2'de hiçbir menü öğesine heartbeat bağlı değildir, dolayısıyla ekranda
 * hiç görünmez. Director heartbeat kaynağı bağlanınca kendiliğinden çalışır.
 *
 * Veri sözleşmesi: 09-data-contracts.md §4 DirectorHeartbeat.
 * Tam tip S7'de üretilecek; burada yalnızca noktanın ihtiyacı olan alanlar var.
 */

export type DirectorStatus =
  | "idle"
  | "monitoring"
  | "analyzing"
  | "reviewing"
  | "processing"
  | "discovering"
  | "error"
  | "offline";

export interface DirectorBeat {
  status: DirectorStatus;
  /** ISO 8601 */
  lastBeat: string;
  beatIntervalMs: number;
}

/** 09-data-contracts.md §4: lastBeat, beatIntervalMs*3'ten eskiyse offline. */
export function isStale(beat: DirectorBeat, now = Date.now()): boolean {
  return now - new Date(beat.lastBeat).getTime() > beat.beatIntervalMs * 3;
}

const STATUS_COLOR: Record<DirectorStatus, string> = {
  idle: "bg-icon-muted",
  monitoring: "bg-success",
  analyzing: "bg-ai",
  reviewing: "bg-ai",
  processing: "bg-ai",
  discovering: "bg-info",
  error: "bg-danger",
  offline: "bg-icon-muted",
};

const STATUS_LABEL: Record<DirectorStatus, string> = {
  idle: "Idle",
  monitoring: "Monitoring",
  analyzing: "Analyzing",
  reviewing: "Reviewing",
  processing: "Processing",
  discovering: "Discovering",
  error: "Error",
  offline: "Offline",
};

export function DirectorStatusDot({ beat }: { beat: DirectorBeat | null }) {
  /* Karşılığı olmayan durum gösterilmez (Fake Dashboard yasağı). */
  if (!beat) return null;

  const status: DirectorStatus = isStale(beat) ? "offline" : beat.status;

  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_COLOR[status]}`}
      /* Renk tek başına anlam taşımaz — durum metni her zaman erişilebilir. */
      title={STATUS_LABEL[status]}
      aria-label={STATUS_LABEL[status]}
      role="img"
    />
  );
}
