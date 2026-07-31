"use client";

/**
 * EvidenceChain — bir iddianın kanıt zinciri. 09-...md §5.
 *
 * EN KRİTİK GÖRSEL KARAR: `supportsOrContradicts` ayırt edilebilir olmalı.
 * Çelişen kanıtı destekleyen kanıtla aynı görünümde listelemek, kanıtı
 * göstermemekten daha kötüdür — kullanıcı zinciri "doğrulanmış" sanır.
 * Ayrım renkle DEĞİL, glyph + etiket + sıralama ile verilir; renk sadece
 * pekiştirir (renk körü erişilebilirliği).
 *
 * Anti-fake: kanıt yoksa liste boş çizilmez, EmptyState çıkar.
 * `sourceQuality` ölçülmemişse meter yerine NoData görünür.
 */

import type { EvidenceRef } from "@/types/executive";
import { EmptyState } from "@/components/ui/empty-state";
import { Caption } from "@/components/ui/typography";
import { Meter } from "./meter";
import { relativeTime, useNow } from "@/lib/clock/tick";

const STANCE = {
  supports: { glyph: "✓", label: "Destekliyor", cls: "text-success border-success" },
  contradicts: { glyph: "✕", label: "Çelişiyor", cls: "text-danger border-danger" },
  neutral: { glyph: "○", label: "Nötr", cls: "text-content-tertiary border-line" },
} as const;

const TYPE_LABEL: Record<EvidenceRef["type"], string> = {
  document: "Belge",
  metric: "Metrik",
  decision: "Karar",
  external: "Dış kaynak",
  conversation: "Konuşma",
};

/** Çelişen kanıt önce gelir — saklanmaz, gömülmez. */
const ORDER = { contradicts: 0, neutral: 1, supports: 2 } as const;

export function EvidenceChain({
  evidence,
  title = "Kanıt zinciri",
}: {
  evidence: EvidenceRef[];
  title?: string;
}) {
  const now = useNow();

  if (!evidence?.length) {
    return (
      <EmptyState
        title="Kanıt yok"
        description="Bu iddiaya bağlı kayıtlı bir kanıt bulunmuyor."
        suggestion="Kanıtsız bir çıktı karar desteği sayılmaz."
        nextStep="Knowledge workspace'inden kaynak bağlayın."
      />
    );
  }

  const sorted = [...evidence].sort((a, b) => ORDER[a.supportsOrContradicts] - ORDER[b.supportsOrContradicts]);
  const contradicting = evidence.filter((e) => e.supportsOrContradicts === "contradicts").length;

  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <p className="text-xs text-content-secondary">
        {evidence.length} kanıt
        {contradicting > 0 && (
          <>
            {" · "}
            <span className="text-danger">{contradicting} çelişen</span>
          </>
        )}
      </p>

      <ul className="flex flex-col gap-2">
        {sorted.map((e) => {
          const stance = STANCE[e.supportsOrContradicts] ?? STANCE.neutral;
          const age = relativeTime(e.freshness, now);
          return (
            <li key={e.id} className={`border-l-2 pl-3 ${stance.cls}`}>
              <p className="flex flex-wrap items-baseline gap-2">
                <span aria-hidden="true">{stance.glyph}</span>
                <span className="sr-only">{stance.label}: </span>
                {e.sourceUrl ? (
                  <a
                    href={e.sourceUrl}
                    className="text-content underline decoration-line underline-offset-2 hover:decoration-line-active"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {e.title}
                  </a>
                ) : (
                  <span className="text-content">{e.title}</span>
                )}
                <Caption>{TYPE_LABEL[e.type]}</Caption>
              </p>

              {e.excerpt && (
                <p className="mt-1 text-sm text-content-secondary">{e.excerpt}</p>
              )}

              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-content-tertiary">
                <Meter
                  value={e.sourceQuality}
                  label={`${e.title} kaynak kalitesi`}
                  tone="neutral"
                  noDataReason="Kaynak kalitesi ölçülmedi"
                />
                {Number.isFinite(e.sourceQuality) && <span>kalite {Math.round(e.sourceQuality)}</span>}
                {age && (
                  <>
                    <span aria-hidden="true">·</span>
                    <time dateTime={e.freshness}>{age}</time>
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
