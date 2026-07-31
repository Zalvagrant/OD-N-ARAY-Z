/** S5 · 1 — Executive Briefing (tam ekran) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExecutiveBriefing } from "./screen";

const meta: Meta = {
  title: "Screens/1 · Executive Briefing",
  parameters: {
    layout: "fullscreen",
    /* useRouter — App Router mock'u */
    nextjs: { appDirectory: true },
  },
};
export default meta;

/** Dolu hâl — mock veriyle. MOCK DATA rozeti başlıkta görünür. */
export const Brifing: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <ExecutiveBriefing />
    </div>
  ),
};

/** Skeleton gerçek yerleşimi temsil eder; içerik gelince layout kaymaz. */
export const Yukleniyor: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <ExecutiveBriefing demo="loading" />
    </div>
  ),
};

/** Veri gelmeyen HER bölüm boş durum gösterir — placeholder değil. */
export const Bos: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <ExecutiveBriefing demo="empty" />
    </div>
  ),
};

/** Hata deseni: ne oldu → neden → etkisi → çözüm → [Yeniden dene]. */
export const Hata: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <ExecutiveBriefing demo="error" />
    </div>
  ),
};
