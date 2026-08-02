/**
 * Amazon · Orders story'leri — UI-ADR-202.
 *
 * Kilitlenen sınırlar:
 *  1. TUTARSIZ SİPARİŞ 0 GÖSTERİLMEZ — Pending satırında "0,00" yazamaz;
 *     toplam kaç siparişi kapsadığını söyler.
 *  2. TÜRETİLMİŞ METRİK YOK — ortalama sepet / dönüşüm / trend geçmez.
 *  3. YAŞ GÖRÜNÜR — kaydın tarihi ve beyan ettiği pencere başlıkta.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { expectRefreshWorks } from "@/features/shell/story-helpers";

import { AmazonOrders } from "./screen";

const meta: Meta<typeof AmazonOrders> = {
  title: "Screens/AmazonOrders",
  component: AmazonOrders,
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

type Story = StoryObj<typeof AmazonOrders>;

export const Siparisler: Story = {
  name: "Anlık görüntü + tablo — tutarsız sipariş 0 değil",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Orders" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of ["Anlık görüntü", "Siparişler"]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 1: toplam kapsamını beyan eder, eksik tutar sayılır. */
    await expect(
      canvas.getByText(/siparişte tutar yok/)
    ).toBeInTheDocument();

    /* SINIR 3: pencere ve tarih görünür. */
    await expect(
      canvas.getAllByText(/günlük kayan pencere/).length
    ).toBeGreaterThan(0);

    /* SINIR 2: türetilmiş metrik yok. */
    await expect(
      canvas.queryByText(/ortalama sepet|dönüşüm|trend/i)
    ).toBeNull();

    /* BUTON GERÇEKTEN ÇALIŞIYOR: tıklanır ve ekran veri
       durumunda kalır (UI-ADR-207). Varlık, çalıştığını kanıtlamaz. */
    await expectRefreshWorks(canvas, "Orders");
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <AmazonOrders demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Orders" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, pencerede sipariş yok",
  render: () => <AmazonOrders demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Orders" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Pencerede sipariş yok")
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep iki bölümde birden yazılır",
  render: () => <AmazonOrders demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Orders" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Sipariş anlık görüntüsü okunamadı")
        ).toHaveLength(2),
      { timeout: 15_000 }
    );
  },
};
