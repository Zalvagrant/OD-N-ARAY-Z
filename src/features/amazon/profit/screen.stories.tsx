/**
 * Amazon · Profit story'leri — UI-ADR-204.
 *
 * Kilitlenen sınırlar:
 *  1. "NET KÂR" DENMEZ — zincirin son halkası KATKI; ekranda "net kâr"
 *     ifadesi ancak "NET KÂR DEĞİL" uyarısı olarak geçebilir.
 *  2. HARİÇ TUTULANLAR GÖRÜNÜR — refunds/advertising rozetleri.
 *  3. `dated:false` GİZLENMEZ — kaydın tarihleme eksikliği yazılı.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { AmazonProfit } from "./screen";

const meta: Meta<typeof AmazonProfit> = {
  title: "Screens/AmazonProfit",
  component: AmazonProfit,
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-bg p-6">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AmazonProfit>;

export const KarZinciri: Story = {
  name: "Zincir + reklam katmanı — katkı, net kâr değil",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Profit" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of [
      "Kâr zinciri",
      "Reklam katmanı",
      "Bu sayı neden net kâr değil",
    ]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 1: "net kâr" yalnız UYARI olarak geçer. */
    await expect(canvas.getByText(/NET KÂR DEĞİL/)).toBeInTheDocument();

    /* SINIR 2: hariç tutulanlar ekranda. */
    await expect(canvas.getByText("refunds")).toBeInTheDocument();
    await expect(canvas.getByText("advertising")).toBeInTheDocument();

    /* SINIR 3: tarihleme eksikliği yazılı. */
    await expect(
      canvas.getByText(/tarihlemesini eksik bildiriyor/)
    ).toBeInTheDocument();
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <AmazonProfit demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Profit" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, kâr kaydı yok",
  render: () => <AmazonProfit demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Profit" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Kâr kaydı ölçülemedi")
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep üç bölümde birden yazılır",
  render: () => <AmazonProfit demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Profit" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(await canvas.findAllByText("Kâr zinciri okunamadı")).toHaveLength(3),
      { timeout: 15_000 }
    );
  },
};
