"use client";

/**
 * HeartbeatIndicator — bir ajanın gerçekten canlı olup olmadığı.
 *
 * ANTI-FAKE, ÜÇ KATMANDA:
 *
 * 1. `lastBeat` yoksa "offline" DENMEZ — durum bilinmiyordur, NoData çıkar.
 *    Bilmemek ile ölmüş olmak farklı şeylerdir.
 * 2. `lastBeat`, `beatIntervalMs * 3`'ten eskiyse offline'a düşer ve
 *    animasyon durur (09-...md §4).
 * 3. Nabız SONSUZ DÖNGÜ DEĞİLDİR: her gerçek atımda bir kez atar
 *    (`key={lastBeat}`). Yeni atım gelmezse hiçbir şey kıpırdamaz —
 *    "canlılık" animasyonun kendisinden değil, veriden gelir.
 *
 * Doküman (07-...md §12) kartta `█████████` biçiminde bir nabız çubuğu
 * gösteriyordu. ÇİZİLMEDİ: 9 çubuk son 9 atımın geçmişini ima eder,
 * DirectorHeartbeat sözleşmesi ise yalnızca `lastBeat` verir. Olmayan bir
 * geçmişi çizmek sahte telemetridir (UI-ADR-090).
 */

import { motion as fm, useReducedMotion } from "framer-motion";
import { motion as preset } from "@/animations/motion";
import { liveness, relativeTime, useNow } from "@/lib/clock/tick";
import { NoData } from "@/components/ui/no-data";

export function HeartbeatIndicator({
  lastBeat,
  beatIntervalMs,
  label = "Nabız",
}: {
  lastBeat: string | null | undefined;
  beatIntervalMs: number;
  label?: string;
}) {
  const now = useNow();
  const reduced = useReducedMotion();
  const state = liveness(lastBeat, beatIntervalMs, now);
  const age = relativeTime(lastBeat, now);

  if (state === "unknown") {
    return <NoData reason={`${label}: atım verisi yok`} />;
  }

  const offline = state === "offline";

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      {offline || reduced ? (
        <span
          className={`h-2 w-2 rounded-full ${offline ? "bg-icon-muted" : "bg-success"}`}
          aria-hidden="true"
        />
      ) : (
        <fm.span
          /* Her gerçek atımda bir kez — döngü yok. */
          key={lastBeat}
          className="h-2 w-2 rounded-full bg-success"
          initial={{ opacity: 0.3, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={preset.fast}
          aria-hidden="true"
        />
      )}
      <span className={offline ? "text-content-tertiary" : "text-success"}>
        {offline ? "offline" : "canlı"}
      </span>
      {age && <span className="text-content-tertiary">· {age}</span>}
      <span className="sr-only">
        {label}: {offline ? "atım alınmıyor" : "atım alınıyor"}
      </span>
    </span>
  );
}
