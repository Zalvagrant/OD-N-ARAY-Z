/** S4 · 2 — DecisionCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DecisionCard } from "./decision-card";
import { decision, envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/2 · DecisionCard",
  parameters: { layout: "padded" },
};
export default meta;

/** Onayla butonu KARTIN ÜZERİNDE — başka ekrana gidilmez. */
export const KararVerilebilir: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard
        env={envelope(decision, { source: "ai" })}
        onDecide={(d) => console.log("approved", d.id)}
        onOpenAnalysis={(d) => console.log("open", d.id)}
      />
    </div>
  ),
};

/** Veri bayat → onay KİLİTLİ, sebebi yazılı. */
export const BayatVeriOnayKilitli: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard
        env={envelope(decision, { freshness: "stale", lastUpdated: new Date(Date.now() - 26 * 3600_000).toISOString() })}
        onDecide={() => {}}
        onOpenAnalysis={() => {}}
      />
    </div>
  ),
};

/** Karar kapandıysa onay butonu hiç çizilmez. */
export const Onaylanmis: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard
        env={envelope({ ...decision, status: "closed" as const })}
        onDecide={() => {}}
        onOpenAnalysis={() => {}}
      />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <DecisionCard env={null} />,
};
