/**
 * Amazon · Listings story'leri — UI-ADR-203.
 *
 * Kilitlenen sınırlar:
 *  1. BİLEŞİK SKOR YOK — "listing sağlığı/puanı" ekranda geçemez.
 *  2. ÖLÇÜLMEMİŞ HÜCRE 0 BASMAZ — sebebini basar.
 *  3. `notes` ÖLÇÜM DEĞİL ve öyle etiketlenir.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { AmazonListings } from "./screen";

const meta: Meta<typeof AmazonListings> = {
  title: "Screens/AmazonListings",
  component: AmazonListings,
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

type Story = StoryObj<typeof AmazonListings>;

export const Katalog: Story = {
  name: "Katalog + ASIN tablosu — skor yok",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Listings" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of ["Katalog", "ASIN performansı", "Kaydın kendi notları"]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 2: ölçülmemiş hücre 0 basmaz, SEBEBİNİ basar. Gerekçe
       `NoData`nın aria-label'ıdır (UI-ADR-156) — metin araması onu
       bulmaz, erişilebilir ad araması bulur. */
    await expect(
      canvas.getAllByRole("note", { name: "Kayıtta ölçülmemiş" }).length
    ).toBeGreaterThan(0);

    /* SINIR 3: notlar ölçüm değil diye yazılı. */
    await expect(canvas.getByText(/ÖLÇÜM DEĞİL/)).toBeInTheDocument();

    /* SINIR 1: bileşik skor yok. */
    await expect(canvas.queryByText(/\bskor\b|sağlık puanı/i)).toBeNull();
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <AmazonListings demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Listings" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, katalog boş",
  render: () => <AmazonListings demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Listings" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(await canvas.findByText("Katalog boş")).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep üç bölümde birden yazılır",
  render: () => <AmazonListings demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Listings" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(await canvas.findAllByText("Katalog okunamadı")).toHaveLength(3),
      { timeout: 15_000 }
    );
  },
};
