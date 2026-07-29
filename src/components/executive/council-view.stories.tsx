/** S4 · 11 — CouncilView + ConsensusIndicator */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConsensusIndicator, CouncilView } from "./council-view";
import { decision } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/11 · CouncilView",
  parameters: { layout: "padded" },
};
export default meta;

/** Consensus · Disagreement · Evidence Quality · Financial Risk · Complexity */
export const Kurul: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <CouncilView decision={decision} />
    </div>
  ),
};

export const SadeceGosterge: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <ConsensusIndicator
        consensus={91}
        disagreement={9}
      />
    </div>
  ),
};

/** Ölçülmemiş gösterge çizilmez — 0 gibi görünmez. */
export const OlculmemisGostergeler: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <ConsensusIndicator
        consensus={null}
        disagreement={null}
      />
    </div>
  ),
};

/** Görüş yoksa "hemfikir" denmez — kurul toplanmamıştır. */
export const KurulToplanmadi: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <CouncilView
        decision={{
          ...decision,
          alternatives: [],
          recommendation: { ...decision.recommendation, minorityOpinions: [] },
        }}
      />
    </div>
  ),
};
