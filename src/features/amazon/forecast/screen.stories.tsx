/**
 * Amazon · Forecast story'leri — UI-ADR-212.
 *
 * Kilitlenen sınırlar:
 *  1. TARİH ÜRETİLMEZ — ekranda hiçbir tükenme TARİHİ yazamaz ve reddin
 *     gerekçesi (ADR-0149) görünür olmalı.
 *  2. ÖLÇÜLMEMİŞ MENZİL "SONSUZ" DEĞİLDİR — sebebi basılır.
 *  3. SATIŞ PENCERESİ kaydın kendi beyanıdır ve görünür.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { expectRefreshWorks } from "@/features/shell/story-helpers";

import { AmazonForecast } from "./screen";

const meta: Meta<typeof AmazonForecast> = {
  title: "Screens/AmazonForecast",
  component: AmazonForecast,
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

type Story = StoryObj<typeof AmazonForecast>;

export const Menzil: Story = {
  name: "Ölçülen menzil — tarih reddedilir",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Forecast" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of [
      "Neden burada tarih yok",
      "Ölçülen menzil",
      "Menzili bilinmeyen SKU'lar",
    ]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 1: reddin gerekçesi ve ne gerektiği yazılı. */
    await expect(
      canvas.getByText("Tahmin üretilmiyor — ADR-0149")
    ).toBeInTheDocument();
    await expect(
      canvas.getByText(/TEDARİK SÜRESİNİ .* EMNİYET STOĞUNU/)
    ).toBeInTheDocument();

    /* SINIR 2: "sonsuz" iddiası hiçbir yerde geçmez. */
    await expect(canvas.queryByText(/sonsuz menzil yazmak/i)).toBeNull();
    await expect(
      canvas.getByText(/sonsuz DEĞİL, bilinmiyor/)
    ).toBeInTheDocument();

    await expectRefreshWorks(canvas, "Forecast");
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <AmazonForecast demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Forecast" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, SKU kaydı yok",
  render: () => <AmazonForecast demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Forecast" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(await canvas.findByText("SKU kaydı yok")).toBeInTheDocument();
    /* Reddin gerekçesi boş durumda da durur: politika yokluğu veriden
       bağımsızdır. */
    await expect(
      canvas.getByText("Tahmin üretilmiyor — ADR-0149")
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep üç bölümde birden yazılır",
  render: () => <AmazonForecast demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Forecast" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Menzil verisi okunamadı")
        ).toHaveLength(3),
      { timeout: 15_000 }
    );
  },
};
