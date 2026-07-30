/** S4 · 11 — CouncilView + ConsensusIndicator */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConsensusIndicator, CouncilView } from "./council-view";
import { recommendation } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/11 · CouncilView",
  parameters: { layout: "padded" },
};
export default meta;

/** Skorlar ÖNERİNİN alanlarıdır (ODIN); disagreement = 100 − consensus. */
export const Kurul: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <CouncilView recommendation={recommendation} />
    </div>
  ),
};

export const SadeceGosterge: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <ConsensusIndicator consensus={66.7} disagreement={33.3} />
    </div>
  ),
};

/** Ölçülmemiş gösterge meter yerine "ölçülmedi" yazar. */
export const OlculmemisGostergeler: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <ConsensusIndicator consensus={null} disagreement={null} />
    </div>
  ),
};

/** Azınlık görüşü yok → "uzlaşma tam" yazılır, boş liste uydurulmaz. */
export const AzinlikYok: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <CouncilView
        recommendation={{ ...recommendation, minorityOpinions: [], consensusScore: 100, disagreementScore: 0 }}
      />
    </div>
  ),
};
