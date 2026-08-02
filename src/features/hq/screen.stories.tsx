/**
 * ODIN HQ story'leri — UI-ADR-213.
 *
 * Kilitlenen sınırlar:
 *  1. BİLEŞİK DURUM SKORU YOK — her sayı bir listenin uzunluğu ya da
 *     çekirdeğin yayınladığı bir değerdir.
 *  2. DETAY ÇİZİLMEZ — HQ'da tablo yok; her blok kendi ekranına bağlar.
 *  3. "Ölçülemeyen" listesi boşsa bu İYİ HABERDİR ve öyle yazılır.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { expectRefreshWorks } from "@/features/shell/story-helpers";

import { Hq } from "./screen";

const meta: Meta<typeof Hq> = {
  title: "Screens/Hq",
  component: Hq,
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

type Story = StoryObj<typeof Hq>;

export const Genel: Story = {
  name: "Beni bekleyenler + nabız — skor yok, tablo yok",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "ODIN HQ" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of [
      "Beni bekleyenler",
      "Sistem nabzı",
      "Ölçülemeyenler",
    ]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 2: HQ detay çizmez — hiçbir tablo yok, ama her blok kendi
       ekranına bağlanır. */
    await expect(canvas.queryByRole("table")).toBeNull();
    for (const hedef of ["/decisions", "/briefing", "/system"]) {
      await expect(
        canvasElement.querySelector(`a[href="${hedef}"]`)
      ).not.toBeNull();
    }

    /* SINIR 1: bileşik bir "genel durum skoru" yok. */
    await expect(
      canvas.queryByText(/genel durum skoru|toplam sağlık puanı/i)
    ).toBeNull();

    await expectRefreshWorks(canvas, "ODIN HQ");
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <Hq demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "ODIN HQ" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ölçülemeyen bileşen yok (iyi haber)",
  render: () => <Hq demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "ODIN HQ" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Ölçülemeyen bileşen yok")
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep üç bölümde birden yazılır",
  render: () => <Hq demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "ODIN HQ" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Genel durum okunamadı")
        ).toHaveLength(3),
      { timeout: 15_000 }
    );
  },
};
