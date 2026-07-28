/** S4 · 10 — OpportunityCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OpportunityCard } from "./opportunity-card";
import { envelope, opportunity, recommendationTekAlternatif } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/10 · OpportunityCard",
  parameters: { layout: "padded" },
};
export default meta;

/** Risk ile EŞİT görsel ağırlık — fırsat yan kutu değildir. */
export const Firsat: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <OpportunityCard env={envelope(opportunity, { source: "ai" })} onApprove={() => {}} />
    </div>
  ),
};

/** Öneri şartı sağlamıyor → fırsat kalır, öneri bölümü çizilmez. */
export const OneriGosterilmez: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <OpportunityCard
        env={envelope({ ...opportunity, recommendedAction: recommendationTekAlternatif })}
      />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <OpportunityCard env={null} />,
};
