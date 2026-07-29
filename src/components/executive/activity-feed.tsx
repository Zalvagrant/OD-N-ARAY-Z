"use client";

/**
 * ActivityFeed — Executive Intelligence Feed (05-dashboard.md §6).
 * Envanterdeki `ActivityFeed` kalemidir (10-component-library.md §10).
 *
 * Sağ panel bir "detay paneli" değil, sürekli akan bir istihbarat akışıdır.
 *
 * ÜÇ SERT KURAL:
 * 1. **Bildirim sesi ve dikkat çeken animasyon YOK.** Yeni öğe yalnızca
 *    yumuşak bir opaklık/konum geçişiyle belirir (12-...md: Context Change).
 *    Yanıp sönme, sallanma, ses — hiçbiri yok.
 * 2. **Aynı anda en fazla `maxVisible` öğe.** On kategori Cognitive Load
 *    Budget'ı zorlar (§6 uyarısı). Gerisi saklanmaz; sayısı yazılır ve tek
 *    tıkla açılır.
 * 3. **Zaman uydurulmaz.** `at === null` ise satırda NoData çıkar.
 *
 * Sıralama `priority` (1 en yüksek), eşitlikte yeni olan üstte. Sözleşmedeki
 * alanlar kullanılır; yeni bir "önem skoru" TÜRETİLMEZ.
 */

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { listItemTransition } from "@/animations/motion";
import { relativeTime, useNow } from "@/lib/clock/tick";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import type { IntelligenceCategory, IntelligenceItem } from "@/types/screens";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NoData } from "@/components/ui/no-data";
import { Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";

/** Renk tek başına anlam taşımaz — her kategorinin glyph'i ve adı vardır. */
const CATEGORY: Record<IntelligenceCategory, { glyph: string; label: string; cls: string }> = {
  critical_risk: { glyph: "▲", label: "Kritik risk", cls: "text-danger" },
  ai_recommendation: { glyph: "◆", label: "AI tavsiyesi", cls: "text-ai-text" },
  director_activity: { glyph: "○", label: "Director aktivitesi", cls: "text-content-tertiary" },
  pending_approval: { glyph: "✓", label: "Bekleyen onay", cls: "text-warning" },
  market_intelligence: { glyph: "i", label: "Market istihbaratı", cls: "text-info" },
  competitor_alert: { glyph: "▲", label: "Rekabet uyarısı", cls: "text-warning" },
  amazon_anomaly: { glyph: "▲", label: "Amazon anomalisi", cls: "text-warning" },
  financial_deviation: { glyph: "▲", label: "Finansal sapma", cls: "text-warning" },
  security_event: { glyph: "i", label: "Güvenlik olayı", cls: "text-info" },
  new_knowledge: { glyph: "◆", label: "Yeni bilgi", cls: "text-ai-text" },
};

export function sortIntelligence(items: IntelligenceItem[]): IntelligenceItem[] {
  return [...items].sort(
    (a, b) =>
      a.priority - b.priority ||
      new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime()
  );
}

function FeedRow({ item, index }: { item: IntelligenceItem; index: number }) {
  const now = useNow();
  const reduced = useReducedMotion();
  const cat = CATEGORY[item.category];
  const age = relativeTime(item.at, now);

  return (
    <motion.li
      initial={reduced ? false : listItemTransition.initial}
      animate={listItemTransition.animate}
      transition={{ ...listItemTransition.transition, delay: reduced ? 0 : index * 0.03 }}
      className="border-b border-line-subtle py-3 last:border-b-0"
    >
      <div className="flex items-baseline gap-2">
        <span className={`shrink-0 text-xs ${cat.cls}`} aria-hidden="true">
          {cat.glyph}
        </span>
        <span className="min-w-0 flex-1 text-sm text-content">{item.title}</span>
      </div>

      <p className="mt-1 flex flex-wrap items-center gap-2 pl-4 text-xs text-content-tertiary">
        <span className={cat.cls}>{cat.label}</span>
        {item.actor && (
          <>
            <span aria-hidden="true">·</span>
            <span>{item.actor}</span>
          </>
        )}
        <span aria-hidden="true">·</span>
        {age ? <time dateTime={item.at ?? undefined}>{age}</time> : <NoData reason="Zaman damgası yok" />}
      </p>

      {item.detail && (
        <p className="mt-1 pl-4 text-xs text-content-secondary">{item.detail}</p>
      )}
    </motion.li>
  );
}

function FeedView({
  items,
  meta,
  maxVisible,
}: {
  items: IntelligenceItem[];
  meta: DataMeta;
  maxVisible: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Akış boş"
        description="Şu an raporlanacak bir istihbarat öğesi yok."
        suggestion="Riskler, AI tavsiyeleri ve Director aktivitesi oluştukça burada birikir."
      />
    );
  }

  const sorted = sortIntelligence(items);
  const shown = expanded ? sorted : sorted.slice(0, maxVisible);
  const hidden = sorted.length - shown.length;

  return (
    <div className="flex flex-col gap-3">
      <TrustSignal meta={meta} />

      <ul className="flex flex-col" aria-label="Executive Intelligence Feed">
        {shown.map((item, i) => (
          <FeedRow key={item.id} item={item} index={i} />
        ))}
      </ul>

      {hidden > 0 ? (
        <Button variant="tertiary" size="sm" onClick={() => setExpanded(true)}>
          {hidden} öğe daha göster
        </Button>
      ) : sorted.length > maxVisible ? (
        <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
          Kısalt
        </Button>
      ) : null}

      <Text size="sm" tone="tertiary">
        {sorted.length} öğe · aynı anda en fazla {maxVisible} tanesi gösterilir.
      </Text>
    </div>
  );
}

export function ActivityFeed({
  env,
  maxVisible = 6,
}: {
  env: DataEnvelope<IntelligenceItem[]> | null | undefined;
  /** 05-...md §6: aynı anda en fazla 5–6 öğe. */
  maxVisible?: number;
}) {
  return (
    <DataGuard env={env} reason="İstihbarat akışı bağlı değil">
      {(items, meta) => <FeedView items={items} meta={meta} maxVisible={maxVisible} />}
    </DataGuard>
  );
}
