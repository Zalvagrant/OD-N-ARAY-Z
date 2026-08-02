/**
 * Amazon · Inventory story'leri — UI-ADR-196.
 *
 * Kilitlenen sınırlar:
 *  1. Tablo YALNIZ ölçülen kolonları çizer: `reorder_units` /
 *     `estimated_stockout_at` / `revenue` canlı veride 48/48 null
 *     (ADR-0149) ve kolonları YOK — sürekli boş kolon tabloyu okunmaz
 *     yapar (UI-ADR-128).
 *  2. "Ölçülmedi" bir sağlık durumu değildir: `unknown` rozeti
 *     "Ölçülmedi" der, `ok` da `critical` de demez.
 *  3. Boş tablo bir CEVAPTIR ("SP-API'den SKU gelmedi") ve katalogda ürün
 *     olmadığı iddiasına ÇEVRİLMEZ.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { AmazonInventory } from "./screen";

const meta: Meta<typeof AmazonInventory> = {
  title: "Screens/AmazonInventory",
  component: AmazonInventory,
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

type Story = StoryObj<typeof AmazonInventory>;

export const Envanter: Story = {
  name: "Stok tablosu — gerçek kolonlar, ölçülmeyen kolon çizilmez",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Inventory" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    /* Ölçülen kolonlar durur… */
    for (const kolon of ["SKU", "Ürün", "Durum", "Stok", "Kalan gün"]) {
      await expect(
        canvas.getByRole("columnheader", { name: kolon })
      ).toBeInTheDocument();
    }
    /* …ölçülmeyenler HİÇ yok (SINIR 1). */
    for (const yok of ["Yeniden sipariş", "Tükenme", "Ciro"]) {
      await expect(
        canvas.queryByRole("columnheader", { name: yok })
      ).toBeNull();
    }

    /* Satırlar mock SKU'larla dolar — tablo boş bir iskelet değil. */
    const satirlar = canvas.getAllByRole("row");
    await expect(satirlar.length).toBeGreaterThan(1);
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır, satır uydurulmaz",
  render: () => <AmazonInventory demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Inventory" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
    await expect(canvas.queryByText("SKU yok")).toBeNull();
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, SKU yok: iddia katalog boş DEĞİL",
  render: () => <AmazonInventory demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Inventory" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(await canvas.findByText("SKU yok")).toBeInTheDocument();
    /* SINIR 3: yokluk, katalog iddiasına çevrilmez. */
    await expect(
      canvas.getByText(/katalogda ürün olmadığı anlamına gelmez/)
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep yazılır, tablo çizilmez",
  render: () => <AmazonInventory demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Inventory" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Envanter okunamadı")
        ).toHaveLength(1),
      { timeout: 15_000 }
    );
    await expect(canvas.queryByRole("columnheader", { name: "SKU" })).toBeNull();
  },
};
