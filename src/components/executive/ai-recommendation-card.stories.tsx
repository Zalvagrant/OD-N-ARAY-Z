/** S4 · 5 — AIRecommendationCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AIRecommendationCard } from "./ai-recommendation-card";
import { envelope, recommendation, recommendationTekAlternatif } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/5 · AIRecommendationCard",
  parameters: { layout: "padded" },
};
export default meta;

/** 7 alanlı explainability + en az 2 alternatif → gösterilir. */
export const Aciklanabilir: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <AIRecommendationCard env={envelope(recommendation)} onApprove={() => {}} />
    </div>
  ),
};

/**
 * KURAL: alternatives.length < 2 → bileşen HİÇ RENDER ETMEZ.
 * Aşağıda bilerek boş kalan alan doğru davranıştır.
 * "Tek seçenek sunan AI önerisi karar desteği değil, dayatmadır."
 */
export const TekAlternatifRenderEtmez: StoryObj = {
  render: () => (
    <div className="max-w-2xl border border-dashed border-line p-4">
      <p className="mb-2 text-xs text-content-tertiary">
        Aşağısı bilerek boş — tek alternatifli öneri çizilmez:
      </p>
      <AIRecommendationCard env={envelope(recommendationTekAlternatif)} />
    </div>
  ),
};

/** Explainability alanı eksik (whyGenerated boş) → yine render etmez. */
export const EksikAciklamaRenderEtmez: StoryObj = {
  render: () => (
    <div className="max-w-2xl border border-dashed border-line p-4">
      <p className="mb-2 text-xs text-content-tertiary">
        Aşağısı bilerek boş — &quot;neden üretildi&quot; alanı yok:
      </p>
      <AIRecommendationCard env={envelope({ ...recommendation, whyGenerated: "" })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <AIRecommendationCard env={null} />,
};
