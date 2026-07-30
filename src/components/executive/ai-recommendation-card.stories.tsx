/** S4 · 5 — AIRecommendationCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AIRecommendationCard } from "./ai-recommendation-card";
import { envelope, recommendation, recommendationEksikAlan } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/5 · AIRecommendationCard",
  parameters: { layout: "padded" },
};
export default meta;

/** ODIN'in 10 zorunlu alanı tam: öneri, flip koşulları ve güven dökümüyle. */
export const Aciklanabilir: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <AIRecommendationCard env={envelope(recommendation, { source: "ai" })} />
    </div>
  ),
};

/** ODIN'in zorunlu kıldığı bir alan (flip_conditions) eksik → HİÇ render
    edilmez. Bastırma gerçeğini çağıran yazar (UI-ADR-091/100). */
export const EksikAlanRenderEtmez: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <p className="mb-2 text-sm text-content-tertiary">
        Aşağıda bir kart OLMALIYDI ama flip_conditions eksik — null döner:
      </p>
      <AIRecommendationCard env={envelope(recommendationEksikAlan, { source: "ai" })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <AIRecommendationCard env={null} />
    </div>
  ),
};
