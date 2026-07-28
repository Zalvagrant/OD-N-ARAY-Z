"use client";

/**
 * Executive Timeline — workspace altındaki yatay şerit.
 * Kaynak: 03-information-architecture.md §16
 *
 * Gösterilecek olaylar: Decision Approved · AI Learned · Risk Increased
 * · Evidence Added · Knowledge Updated · Automation Completed
 *
 * ANTI-FAKE: olay kaynağı (IEventBus) bağlı değil. Uydurma olay yerine
 * durumun ne olduğu açıkça yazılır.
 */

export function ExecutiveTimeline() {
  const events: never[] = [];

  return (
    <div
      className="flex h-10 shrink-0 items-center gap-4 border-t border-line bg-bg px-4 text-sm"
      aria-label="Executive Timeline"
    >
      <span className="shrink-0 text-xs uppercase tracking-wide text-content-tertiary">
        Timeline
      </span>
      {events.length === 0 ? (
        <span className="truncate text-content-tertiary">
          Olay akışı bağlı değil — ODIN event bus&apos;a bağlanınca son
          yönetici olayları burada görünecek.
        </span>
      ) : null}
    </div>
  );
}
