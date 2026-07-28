"use client";

/**
 * TelemetryBar — 03-information-architecture.md §16, 09-...md §12, UI-ADR-083.
 *
 * Kanal listesi bileşende SABİT DEĞİLDİR: `activeTelemetryChannels()`
 * registry'den gelir. Yeni bir servis canlıya çıkınca yapılacak tek iş
 * registry'de `available: true` demektir — bu dosyaya dokunulmaz.
 *
 * ANTI-FAKE:
 *  - `available: false` kanal çizilmez.
 *  - Açık kanalın değeri gelmemişse "0" YAZILMAZ, NoData çıkar.
 *    "0 hata" ile "hata sayısı bilinmiyor" farklı şeylerdir.
 */

import type { TelemetryValues } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { activeTelemetryChannels, type TelemetryChannel } from "@/lib/telemetry/registry";
import { NoData } from "@/components/ui/no-data";
import { Num } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";
import { relativeTime, useNow } from "@/lib/clock/tick";

function ChannelValue({
  channel,
  value,
  now,
}: {
  channel: TelemetryChannel;
  value: number | string | null | undefined;
  now: number | null;
}) {
  if (value === null || value === undefined || value === "") {
    return <NoData reason={`${channel.label}: değer gelmedi`} />;
  }

  if (channel.format === "timestamp") {
    const age = typeof value === "string" ? relativeTime(value, now) : null;
    return age ? (
      <time dateTime={String(value)} className="text-content">
        {age}
      </time>
    ) : (
      <NoData reason={`${channel.label}: zaman okunamadı`} />
    );
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return <span className="text-content">{String(value)}</span>;
  }

  switch (channel.format) {
    case "currency":
      return <Num value={value} format="currency" size="sm" />;
    case "duration":
      return (
        <span className="text-content">
          <Num value={value} size="sm" /> ms
        </span>
      );
    case "rate":
      return (
        <span className="text-content">
          <Num value={value} size="sm" /> /dk
        </span>
      );
    default:
      return <Num value={value} size="sm" />;
  }
}

export function TelemetryBar({
  env,
}: {
  env: DataEnvelope<TelemetryValues> | null | undefined;
}) {
  const now = useNow();
  const channels = activeTelemetryChannels();

  return (
    <DataGuard env={env} reason="Telemetri akışı yok">
      {(values, meta) => (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line-subtle px-4 py-2 text-xs">
          {channels.map((c) => (
            <dl key={c.id} className="flex items-baseline gap-2">
              <dt className="text-content-tertiary">{c.label}</dt>
              <dd>
                <ChannelValue channel={c} value={values[c.id]} now={now} />
              </dd>
            </dl>
          ))}
          <TrustSignal meta={meta} className="ml-auto" />
        </div>
      )}
    </DataGuard>
  );
}
