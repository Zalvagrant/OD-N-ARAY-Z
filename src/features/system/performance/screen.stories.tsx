/**
 * System · Performance story'leri — UI-ADR-199.
 *
 * Kilitlenen sınırlar:
 *  1. Koşum/hata sayıları HAM ve YAN YANA — arayüz başarı oranı
 *     TÜRETMEZ (UI-ADR-111). Ekranda hiçbir yerde "%.. başarı" yazmaz.
 *  2. Gecikme kartı istemci ölçümüdür ve öyle ETİKETLENİR — "ODIN
 *     yayını değil" metni görünür.
 *  3. Uptime/CPU/RAM ÇİZİLMEZ — hiçbir uçta yayınlanmıyor.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { SystemPerformance } from "./screen";

const meta: Meta<typeof SystemPerformance> = {
  title: "Screens/SystemPerformance",
  component: SystemPerformance,
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

type Story = StoryObj<typeof SystemPerformance>;

export const Performans: Story = {
  name: "Nabız + işler + gecikme — ham sayılar, oran yok",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Performance" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of [
      "Çekirdek nabzı",
      "Zamanlanmış işler",
      "/api/state bekleme süresi",
    ]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 1: sayı ham; hiçbir yerde başarı yüzdesi yok. */
    await expect(canvas.getAllByText(/koşum/).length).toBeGreaterThan(0);
    await expect(canvas.queryByText(/başarı/i)).toBeNull();

    /* SINIR 2: gecikmenin istemci ölçümü olduğu YAZILI. */
    await expect(canvas.getByText(/ODIN yayını değil/)).toBeInTheDocument();

    /* SINIR 3: yayınlanmayan metrik çizilmez. */
    for (const yok of ["Uptime", "CPU", "RAM"]) {
      await expect(canvas.queryByText(yok)).toBeNull();
    }
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <SystemPerformance demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Performance" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, zamanlanmış iş yok",
  render: () => <SystemPerformance demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Performance" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Zamanlanmış iş yok")
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep üç bölümde birden yazılır",
  render: () => <SystemPerformance demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Performance" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Performans verisi okunamadı")
        ).toHaveLength(3),
      { timeout: 15_000 }
    );
  },
};
