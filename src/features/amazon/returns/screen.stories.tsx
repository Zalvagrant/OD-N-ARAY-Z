/**
 * Amazon · Returns story'leri — UI-ADR-203.
 *
 * Kilitlenen sınırlar:
 *  1. ÖLÇEK BEYANDAN OKUNUR — 0,0922 ekranda %9,22 yazar, %922 değil.
 *     Bu ekranın en tehlikeli hatası budur ve burada kilitlenir.
 *  2. "Total" satırı ÜRÜN LİSTESİNDE DEĞİL, ayrı kartta.
 *  3. SIFIR YORUM SIFIR YILDIZ DEĞİLDİR — sebep basılır.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { expectRefreshWorks } from "@/features/shell/story-helpers";

import { AmazonReturns } from "./screen";

const meta: Meta<typeof AmazonReturns> = {
  title: "Screens/AmazonReturns",
  component: AmazonReturns,
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

type Story = StoryObj<typeof AmazonReturns>;

export const Iadeler: Story = {
  name: "Özet + ürün tablosu — ölçek beyandan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Returns" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of ["Kaydın özeti", "Ürün bazlı iade"]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 1: 0,0922 → %9,22. Ölçek yanlış uygulansaydı %922 yazardı. */
    await expect(canvas.getByText("9,22")).toBeInTheDocument();
    await expect(canvas.queryByText("922,00")).toBeNull();

    /* SINIR 2: Total satırı ürün tablosunda değil. */
    await expect(
      canvas.getByText(/ürün listesine dahil edilmez/)
    ).toBeInTheDocument();

    /* BUTON GERÇEKTEN ÇALIŞIYOR: tıklanır ve ekran veri
       durumunda kalır (UI-ADR-207). Varlık, çalıştığını kanıtlamaz. */
    await expectRefreshWorks(canvas, "Returns");
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <AmazonReturns demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Returns" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, ürün satırı yok",
  render: () => <AmazonReturns demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Returns" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(await canvas.findByText("Ürün satırı yok")).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep iki bölümde birden yazılır",
  render: () => <AmazonReturns demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Returns" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(await canvas.findAllByText("İade kaydı okunamadı")).toHaveLength(2),
      { timeout: 15_000 }
    );
  },
};
