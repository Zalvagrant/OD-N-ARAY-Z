/** S4 · 9 — AlertStack */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AlertStack } from "./alert-stack";
import { alerts, envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/9 · AlertStack",
  parameters: { layout: "padded" },
};
export default meta;

/**
 * KURAL: requiresAction:false olan öğe listeye GİRMEZ.
 * Fixture'daki 3 uyarıdan biri bilgi amaçlıdır → 2 satır görünür,
 * altta "1 olay listelenmedi" yazar. Sessiz yutma yoktur.
 */
export const SadeceAksiyonGerektirenler: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <AlertStack env={envelope(alerts, { source: "internal" })} />
    </div>
  ),
};

export const HicAksiyonYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <AlertStack env={envelope(alerts.filter((a) => !a.requiresAction), { source: "internal" })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <AlertStack env={null} />,
};
