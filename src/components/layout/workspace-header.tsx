"use client";

/**
 * WorkspaceHeader — 03-information-architecture.md §4.
 *
 * Beş bilgi, her workspace'te aynı sırada:
 *   Workspace Name → Current Context → Quick Actions → Search → Last Sync
 *
 * `Last Sync` İSTEĞE BAĞLI DEĞİLDİR (§4): Trust Signals kuralının somut
 * karşılığıdır. Zaman damgası yoksa "az önce" uydurulmaz — NoData çıkar
 * (istemci saati gelmeden yaş metni hiç yazılmaz, bkz. UI-ADR-089).
 *
 * Search yalnızca gerçekten arama yapılan ekranda verilir. Hiçbir şeyi
 * filtrelemeyen dekoratif bir arama kutusu, sahte bir yetenektir.
 */

import type { ReactNode } from "react";
import { relativeTime, useNow } from "@/lib/clock/tick";
import { NoData } from "@/components/ui/no-data";
import { Heading } from "@/components/ui/typography";

export function WorkspaceHeader({
  title,
  context,
  actions,
  search,
  lastSync,
}: {
  title: string;
  /** Current Context — "Lillu Universe", "US Marketplace" gibi */
  context?: ReactNode;
  actions?: ReactNode;
  search?: ReactNode;
  /** ISO 8601. null → NoData; tahmin edilmez. */
  lastSync: string | null;
}) {
  const now = useNow();
  const age = relativeTime(lastSync, now);

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-4">
      <Heading level={1} size={2} className="min-w-0 truncate">
        {title}
      </Heading>

      {context && (
        <span className="min-w-0 truncate text-sm text-content-secondary">
          <span aria-hidden="true" className="mr-2 text-content-tertiary">
            ·
          </span>
          {context}
        </span>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-3">
        {actions}
        {search}
        <span className="flex items-center gap-2 text-xs text-content-tertiary">
          Son senkron
          {lastSync && age ? (
            <time dateTime={lastSync} className="text-content-secondary">
              {age}
            </time>
          ) : (
            <NoData reason="Senkronizasyon zamanı bilinmiyor" />
          )}
        </span>
      </div>
    </header>
  );
}
