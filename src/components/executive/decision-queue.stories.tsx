/** S5 · 16 — DecisionQueue */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DecisionQueue } from "./decision-queue";
import { decision, envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/16 · DecisionQueue",
  parameters: { layout: "padded" },
};
export default meta;

const many = [
  decision,
  { ...decision, id: "d2", title: "SKU-1042 acil tedarik", priority: 1 as const },
  { ...decision, id: "d3", title: "USD pozisyonunu kıs", priority: 2 as const },
  { ...decision, id: "d4", title: "Listeleme güncellemesi", priority: 3 as const },
  { ...decision, id: "d5", title: "İade politikası", priority: 4 as const },
];

/** Üç primary kart gösterilir; bastırılan sayı yazılır, saklanmaz. */
export const OncelikSirasiyla: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionQueue env={envelope(many)} limit={3} />
    </div>
  ),
};

export const KararYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionQueue env={envelope([])} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionQueue env={null} />
    </div>
  ),
};
