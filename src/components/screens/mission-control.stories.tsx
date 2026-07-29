/** S5 · 2 — Mission Control (tam ekran) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MissionControl } from "./mission-control";

const meta: Meta = {
  title: "Screens/2 · Mission Control",
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
};
export default meta;

/** Primary Focus: Mission Board. Sözleşmesi olmayan üç bölüm boş görünür. */
export const Operasyon: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <MissionControl />
    </div>
  ),
};

export const Yukleniyor: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <MissionControl demo="loading" />
    </div>
  ),
};

export const Bos: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <MissionControl demo="empty" />
    </div>
  ),
};

export const Hata: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <MissionControl demo="error" />
    </div>
  ),
};
