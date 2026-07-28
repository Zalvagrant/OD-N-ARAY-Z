/** S3 · 14 — Sparkline (KPI kartı için) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Sparkline } from "./sparkline";
import { Caption, Label, Num } from "./typography";
import { Card, CardBody } from "./card";

const UP = [12, 14, 13, 17, 19, 21, 24];
const DOWN = [24, 22, 23, 19, 16, 15, 12];

const meta: Meta<typeof Sparkline> = {
  title: "Core/14 · Sparkline",
  component: Sparkline,
  parameters: { layout: "padded" },
};
export default meta;

export const Directions: StoryObj = {
  render: () => (
    <div className="flex items-center gap-8">
      <Sparkline values={UP} label="Ciro" />
      <Sparkline values={DOWN} label="ACOS" />
      <Sparkline values={[10, 10, 10, 10]} label="Stok" />
      <Sparkline values={[42]} label="Yeni metrik" />
    </div>
  ),
};

/** KPI kartındaki gerçek kullanım — Level 1 (05-dashboard.md §4). */
export const InKpiCard: StoryObj = {
  render: () => (
    <Card className="max-w-64">
      <CardBody density="compact">
        <Label>Net Ciro</Label>
        <div className="mt-2 flex items-end justify-between gap-3">
          <Num value={124_300} format="currency" size="2xl" />
          <Sparkline values={UP} label="Net ciro trendi" />
        </div>
        <Caption>Son 7 gün</Caption>
      </CardBody>
    </Card>
  ),
};

export const NotEnoughData: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3">
      <Sparkline values={[null, null]} label="Yeni SKU cirosu" />
      <Caption>İki noktadan az veri = trend değil. Çizgi çizilmez.</Caption>
    </div>
  ),
};
