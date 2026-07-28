/** S3 · 15 — Timeline */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Timeline, type TimelineItem } from "./timeline";

const ITEMS: TimelineItem[] = [
  {
    id: "1",
    at: "2026-07-28T09:12:00+03:00",
    title: "ACOS eşiği aşıldı",
    description: "LLU-HA-2024-BLK kampanyasında ACOS %38'e çıktı.",
    tone: "warning",
    actor: "Amazon Director",
  },
  {
    id: "2",
    at: "2026-07-28T09:14:00+03:00",
    title: "Öneri üretildi",
    description: "Bütçe %15 düşürülsün — 3 alternatifle birlikte.",
    tone: "ai",
    actor: "Amazon Director",
  },
  {
    id: "3",
    at: "2026-07-28T10:02:00+03:00",
    title: "Karar onaylandı",
    tone: "success",
    actor: "Sen",
  },
  {
    id: "4",
    at: null,
    title: "Eski kayıt",
    description: "Zaman damgası yok — 'az önce' UYDURULMAZ.",
    tone: "neutral",
  },
];

const meta: Meta<typeof Timeline> = {
  title: "Core/15 · Timeline",
  component: Timeline,
  parameters: { layout: "padded" },
};
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <Timeline items={ITEMS} />
    </div>
  ),
};

export const Selectable: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <Timeline items={ITEMS} onSelect={() => {}} />
    </div>
  ),
};

export const Loading: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <Timeline items={[]} loading />
    </div>
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <Timeline items={[]} />
    </div>
  ),
};
