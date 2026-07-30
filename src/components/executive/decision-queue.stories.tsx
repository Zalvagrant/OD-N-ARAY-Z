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
  { ...decision, id: "d2", question: "SKU-1042 acil tedarik açılsın mı?", tier: "D2" as const },
  { ...decision, id: "d3", question: "USD pozisyonu kısılsın mı?", tier: "D3" as const },
  { ...decision, id: "d4", question: "Listeleme güncellensin mi?", tier: "D1" as const },
  { ...decision, id: "d5", question: "İade politikası değişsin mi?", tier: "D1" as const },
];

/** Üç primary kart; sıralama tier (D3 stratejik önce), bastırılan sayı yazılır. */
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
