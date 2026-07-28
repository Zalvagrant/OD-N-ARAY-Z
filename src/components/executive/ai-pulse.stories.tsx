/** S4 · 13 — AIPulse */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AIPulse } from "./ai-pulse";
import { envelope, pulse } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/13 · AIPulse",
  parameters: { layout: "padded" },
};
export default meta;

/**
 * 3 halka çizilir: processing · memory_knowledge · prediction.
 * Fixture'da reasoning ve reflection %99 yükle "aktif" görünüyor ama
 * available:false oldukları için ÇİZİLMEZLER (UI-ADR-071).
 * prediction active:false → halka döner değil, soluk ve duruyor.
 */
export const UcGercekHalka: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <AIPulse env={envelope(pulse, { source: "internal" })} />
    </div>
  ),
};

/** Hiçbir kanal veri üretmiyorsa boş çekirdek animasyonu çizilmez. */
export const OlculebilirKanalYok: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <AIPulse env={envelope({}, { source: "internal" })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <AIPulse env={null} />,
};
