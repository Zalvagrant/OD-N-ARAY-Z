/** S4 · 4 — AIBrief */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AIBrief } from "./ai-brief";
import { brief, envelope, recommendationEksikAlan } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/4 · AIBrief",
  parameters: { layout: "padded" },
};
export default meta;

/** 📊 → 🔍 → 🧠 → 🎯 → 📑 — sıra sabittir. */
export const BesAdim: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <AIBrief env={envelope(brief)} />
    </div>
  ),
};

/**
 * Öneri 2 alternatif şartını sağlamıyor → 🎯 adımı boş bırakılmaz,
 * BASTIRMA GERÇEĞİ yazılır. Sahte öneri de üretilmez.
 */
export const OneriBastirildi: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <AIBrief env={envelope({ ...brief, recommendation: recommendationEksikAlan })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <AIBrief env={null} />,
};
