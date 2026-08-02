/**
 * Settings story'leri — UI-ADR-211.
 *
 * Kilitlenen sınırlar:
 *  1. KAYDET/UYGULA DÜĞMESİ YOK — hiçbir yere yazmayan bir kontrol bu
 *     operasyonun avladığı şeydir. Ekrandaki TEK düğme "Yenile".
 *  2. SALT OKUNUR OLDUĞU YAZILI ve gerekçesi çekirdekten gelir.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { expectRefreshWorks } from "@/features/shell/story-helpers";

import { Settings } from "./screen";

const meta: Meta<typeof Settings> = {
  title: "Screens/Settings",
  component: Settings,
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

type Story = StoryObj<typeof Settings>;

export const Ayarlar: Story = {
  name: "Salt okunur yapılandırma — Kaydet düğmesi YOK",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Settings" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of [
      "Neden burada Kaydet düğmesi yok",
      "Çalışma zamanı",
      "Dizinler",
      "Komut yüzeyi",
      "Ortam değişkenleri",
    ]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 2: salt okunurluk yazılı, gerekçe çekirdekten. */
    await expect(canvas.getByText("Salt okunur")).toBeInTheDocument();
    await expect(
      canvas.getByText(/yazılabilir bir ayar ucu yayınlamıyor/)
    ).toBeInTheDocument();

    /* SINIR 1: ekrandaki TEK düğme Yenile. Ölü kontrol yok. */
    const dugmeler = canvas.getAllByRole("button").map((b) => b.textContent);
    await expect(dugmeler).toEqual(["Yenile"]);

    await expectRefreshWorks(canvas, "Settings");
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <Settings demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Settings" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, komut yüzeyi boş",
  render: () => <Settings demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Settings" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Komut yüzeyi boş")
    ).toBeInTheDocument();
    /* Portlar boşalmaz: komutsuz bir kurulum da bir porta bağlıdır. */
    await expect(canvas.getByText("8.765")).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep beş bölümde birden yazılır",
  render: () => <Settings demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Settings" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Yapılandırma okunamadı")
        ).toHaveLength(5),
      { timeout: 15_000 }
    );
  },
};
