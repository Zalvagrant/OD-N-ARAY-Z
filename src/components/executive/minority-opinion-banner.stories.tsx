/** S4 · 12 — MinorityOpinionBanner */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MinorityOpinionBanner } from "./minority-opinion-banner";
import { recommendation } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/12 · MinorityOpinionBanner",
  parameters: { layout: "padded" },
};
export default meta;

/** Nötr ton, gizleme prop'u YOK. ODIN düz metin listesi verir. */
export const Bastirilmis: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <MinorityOpinionBanner opinions={recommendation.minorityOpinions} />
    </div>
  ),
};

/** Görüş yoksa kutu da yok — boş kutu gürültüdür. */
export const GorusYok: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <MinorityOpinionBanner opinions={[]} />
      <p className="text-sm text-content-tertiary">
        (Yukarıda hiçbir şey render edilmedi — doğru davranış.)
      </p>
    </div>
  ),
};
