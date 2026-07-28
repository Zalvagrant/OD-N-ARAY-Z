"use client";

/**
 * Status Bar — Live Neural Telemetry.
 * Kaynak: 03-information-architecture.md §16 (UI-ADR-071 / UI-ADR-083)
 *
 * Kanal listesi kayıt defterinden gelir; available:false olan kanal ÇİZİLMEZ.
 * Şu an 4 kanal açık, hiçbirinin ölçümü bağlı değil → değer yerine NoData.
 * Sahte sayı üretmek "Fake Dashboard" yasağının ihlalidir.
 */

import { activeTelemetryChannels } from "@/lib/telemetry/registry";
import { NoData } from "@/components/ui/no-data";

export function StatusBar() {
  const channels = activeTelemetryChannels();

  return (
    <footer className="flex h-8 shrink-0 items-center gap-6 border-t border-line bg-bg-secondary px-4 text-xs">
      {channels.map((c) => (
        <div key={c.id} className="flex items-center gap-2">
          <span className="text-content-tertiary">{c.label}</span>
          <NoData reason={`${c.label}: kaynak (${c.source}) bağlı değil`} />
        </div>
      ))}
      <div className="ml-auto text-content-tertiary">
        {channels.length} kanal açık
      </div>
    </footer>
  );
}
