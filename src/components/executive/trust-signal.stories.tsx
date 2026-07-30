/** S4 · 8 — TrustSignal */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrustSignal } from "./trust-signal";
import { ago, meta as fixtureMeta } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/8 · TrustSignal",
  parameters: { layout: "padded" },
};
export default meta;

/** Her veri bileşeninde zorunlu: kaynak · tazelik · yaş. */
export const UcTazelik: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      <TrustSignal meta={fixtureMeta({ source: "sp-api", freshness: "live", lastUpdated: ago(30_000) })} />
      <TrustSignal meta={fixtureMeta({ source: "ads-api", freshness: "recent", lastUpdated: ago(20 * 60_000) })} />
      <TrustSignal meta={fixtureMeta({ source: "manual", freshness: "stale", lastUpdated: ago(3 * 24 * 3600_000) })} />
    </div>
  ),
};

/**
 * S7 · UI-ADR-115 — bayat veri ile YENİLENEMEYEN veri aynı şey değildir.
 *
 * Üstteki satır "üç gün önce güncellendi" der ve bu normal olabilir.
 * Alttaki satır aynı yaşa ek olarak "son deneme başarısız" der: sistem
 * çalışmıyor. CEO'nun o sayıya dayanarak karar verip vermeyeceği bu farka
 * bağlıdır; ikisi tek bir "bayat" damgasında birleştirilemez.
 */
export const YenilemeBasarisiz: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      <TrustSignal
        meta={fixtureMeta({ source: "sp-api", freshness: "stale", lastUpdated: ago(3 * 3600_000) })}
      />
      <TrustSignal
        meta={fixtureMeta({ source: "sp-api", freshness: "stale", lastUpdated: ago(3 * 3600_000) })}
        refreshFailed="ODIN isteği reddetti (500)"
      />
    </div>
  ),
};

/** Tazelik yalnızca renkle değil glyph (● ◐ ○) ve kelimeyle de verilir. */
export const TumKaynaklar: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-2">
      {(["sp-api", "ads-api", "internal", "ai", "manual", "computed"] as const).map((s) => (
        <TrustSignal key={s} meta={fixtureMeta({ source: s })} />
      ))}
    </div>
  ),
};
