/** S3 · 14 — Sparkline (KPI kartı için) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
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

/**
 * UI-ADR-150 — envanter kapısının davranış koşulu.
 * Sparkline'ın iki anti-fake kuralı var ve ikisi de sessizce bozulabilir.
 */
export const IkiNoktadanAzsaCIZMEZ: StoryObj = {
  name: "İki noktadan az veri varsa ÇİZGİ ÇİZİLMEZ",
  render: () => (
    <div className="flex flex-col gap-2">
      <span data-testid="one">
        <Sparkline values={[42]} label="Tek nokta" />
      </span>
      <span data-testid="nulls">
        <Sparkline values={[null, null, 7]} label="Boşluklu" />
      </span>
      <span data-testid="ok">
        <Sparkline values={[1, 5]} label="Yeterli" />
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const at = (id: string) => canvasElement.querySelector(`[data-testid="${id}"]`)!;

    /* Tek noktadan çizilen bir "trend" bir TREND DEĞİLDİR — iki noktası
       olmayan çizgi, olmayan bir yön iddia eder. */
    await expect(at("one").querySelector("svg")).toBeNull();
    /* `null` bir ölçüm değildir; sayılmaz. */
    await expect(at("nulls").querySelector("svg")).toBeNull();
    await expect(at("ok").querySelector("svg")).not.toBeNull();
  },
};

export const YonRENKTEN_BAGIMSIZ: StoryObj = {
  name: "Yön yalnız renkle değil, erişilebilir ADDA da yazılı",
  render: () => (
    <div className="flex flex-col gap-2">
      <Sparkline values={[1, 2, 9]} label="Satış" />
      <Sparkline values={[9, 2, 1]} label="İade" />
      <Sparkline values={[4, 6, 4]} label="Stok" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* Renk körü kullanıcı için yeşil/kırmızı hiçbir şey söylemez. */
    await expect(canvas.getByRole("img", { name: /Satış — yükseliyor/ })).toBeInTheDocument();
    await expect(canvas.getByRole("img", { name: /İade — düşüyor/ })).toBeInTheDocument();
    await expect(canvas.getByRole("img", { name: /Stok — yatay/ })).toBeInTheDocument();
  },
};
