/** S4 · 6 — EvidenceChain */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EvidenceChain } from "./evidence-chain";
import { evidence } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/6 · EvidenceChain",
  parameters: { layout: "padded" },
};
export default meta;

/** Çelişen kanıt ÜSTTE ve ayrı glyph'le — gömülmez. */
export const DestekVeCeliski: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <EvidenceChain evidence={evidence} />
    </div>
  ),
};

export const SadeceDestek: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <EvidenceChain evidence={evidence.filter((e) => e.supportsOrContradicts === "supports")} />
    </div>
  ),
};

/** Kaynak kalitesi ölçülmemişse meter yerine "veri yok". */
export const KaliteOlculmemis: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <EvidenceChain
        evidence={[{ ...evidence[0]!, sourceQuality: Number.NaN, freshness: "" }]}
      />
    </div>
  ),
};

export const KanitYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <EvidenceChain evidence={[]} />
    </div>
  ),
};
