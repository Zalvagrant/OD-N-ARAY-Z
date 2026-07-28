/** S4 · 15 — HeartbeatIndicator */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HeartbeatIndicator } from "./heartbeat-indicator";
import { ago } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/15 · HeartbeatIndicator",
  parameters: { layout: "padded" },
};
export default meta;

/** Üç durum: canlı · offline · bilinmiyor. Sahte nabız yok. */
export const UcDurum: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div>
        <span className="mr-2 text-xs text-content-tertiary">2 sn önce atım (aralık 5 sn):</span>
        <HeartbeatIndicator lastBeat={ago(2_000)} beatIntervalMs={5_000} />
      </div>
      <div>
        <span className="mr-2 text-xs text-content-tertiary">60 sn önce atım (3×5 sn aşıldı):</span>
        <HeartbeatIndicator lastBeat={ago(60_000)} beatIntervalMs={5_000} />
      </div>
      <div>
        <span className="mr-2 text-xs text-content-tertiary">Atım verisi yok:</span>
        <HeartbeatIndicator lastBeat={null} beatIntervalMs={5_000} />
      </div>
      <div>
        <span className="mr-2 text-xs text-content-tertiary">Aralık tanımsız:</span>
        <HeartbeatIndicator lastBeat={ago(1_000)} beatIntervalMs={0} />
      </div>
    </div>
  ),
};
