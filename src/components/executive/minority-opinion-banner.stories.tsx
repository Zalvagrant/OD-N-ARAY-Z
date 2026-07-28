/** S4 · 12 — MinorityOpinionBanner */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MinorityOpinionBanner } from "./minority-opinion-banner";
import { decision } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/12 · MinorityOpinionBanner",
  parameters: { layout: "padded" },
};
export default meta;

/**
 * ASLA katlanmaz: bileşende gizleme prop'u YOKTUR.
 * Ama görsel olarak BASTIRILMIŞTIR — amber değil, nötr ton.
 * Azınlık görüşü bir uyarı değil, bir bakış açısıdır.
 */
export const Bastirilmis: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <MinorityOpinionBanner opinion={decision.minorityOpinion} />
    </div>
  ),
};

/** Azınlık görüşü yoksa boş kutu da yok. */
export const GorusYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl border border-dashed border-line p-4">
      <p className="mb-2 text-xs text-content-tertiary">Aşağısı bilerek boş:</p>
      <MinorityOpinionBanner opinion={null} />
    </div>
  ),
};
