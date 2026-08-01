/** S4 · 8 — TrustSignal */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
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

/**
 * UI-ADR-158 — TAZELİK ÖNBELLEKTE DONMAZ.
 *
 * `meta.freshness` fetch anında bir kez hesaplanıp React Query
 * önbelleğinde donuyordu; yaş ise `useNow` ile canlı tazeleniyordu.
 * Sonuç: aynı satırda **"● canlı · 50 dk önce"**. Çelişen iki işaret, hiç
 * işaret olmamasından kötüdür — kullanıcı hangisine inanacağını bilemez
 * ve `TrustSignal`ın TEK işi o güveni kurmaktır.
 */
export const DonmusDamgaDuzeltilir: StoryObj = {
  name: "Zarf 'canlı' dese bile YAŞ bayatsa bayat yazılır",
  render: () => (
    <TrustSignal
      meta={{
        source: "internal",
        /* 50 dakika önce — `default` modülde `recent` eşiği 60 dk,
           `live` eşiği 5 dk. Yani gerçek tazelik "yakın", "canlı" DEĞİL. */
        lastUpdated: new Date(Date.now() - 50 * 60_000).toISOString(),
        /* Zarf YALAN söylüyor: adaptör fetch anında "live" damgalamıştı. */
        freshness: "live",
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* ASIL İDDİA: zarftaki donmuş damga DEĞİL, ölçülen yaş kazanır. */
    await expect(canvas.queryByText("canlı")).toBeNull();
    await expect(canvas.getByText("yakın")).toBeInTheDocument();

    /* Ve yaş ile etiket ARTIK ÇELİŞMİYOR. */
    await expect(canvas.getByText(/50 dk önce/)).toBeInTheDocument();
  },
};
