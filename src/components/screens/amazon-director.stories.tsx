/** S6 · 3 — Amazon Director (tam ekran) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AmazonDirector } from "./amazon-director";

const meta: Meta = {
  title: "Screens/3 · Amazon Director",
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
};
export default meta;

/**
 * Referans modül. Primary Focus: Executive Glance + KPI Strip.
 * Net kâr ve Profit After Ads BİLEREK boştur (UI-ADR-116); Sales & Profit ile
 * Orders bölümlerinin sözleşmesi yoktur (UI-ADR-096).
 */
export const Amazon: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <AmazonDirector />
    </div>
  ),
};

export const Yukleniyor: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <AmazonDirector demo="loading" />
    </div>
  ),
};

export const Bos: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <AmazonDirector demo="empty" />
    </div>
  ),
};

export const Hata: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <AmazonDirector demo="error" />
    </div>
  ),
};
