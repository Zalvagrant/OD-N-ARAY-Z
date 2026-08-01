"use client";

/**
 * Executive Intelligence Feed — sağ panelin Executive Briefing'deki içeriği
 * (05-dashboard.md §6).
 *
 * Sağ panel bileşeni MODÜLE ÖZEL YAZILMAZ (03-...md §7): kabuk aynı kalır,
 * yalnızca içerik sağlayıcısı değişir. Bu dosya o sağlayıcıdır.
 */

import { useOdinFeed } from "@/lib/data/odin-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ActivityFeed } from "@/components/executive/activity-feed";

export function IntelligenceFeed() {
  /* CANLI — `/api/state.timeline` (S10 · G3). Öncelik sinyali ODIN'de
     yok, bu yüzden akış kronolojik; uydurulmuş bir aciliyet sırası yok. */
  const feed = useOdinFeed();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-content-tertiary">
          Intelligence Feed
        </span>
      </div>

      {feed.loading ? (
        <LoadingState layout="list" count={6} label="İstihbarat akışı yükleniyor" />
      ) : (
        <ActivityFeed env={feed.envelope} maxVisible={6} />
      )}
    </div>
  );
}
