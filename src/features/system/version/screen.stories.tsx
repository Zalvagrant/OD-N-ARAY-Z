/**
 * System · Version story'leri — UI-ADR-211.
 *
 * Kilitlenen sınırlar:
 *  1. KİRLİ AĞAÇ GİZLENMEZ — uyarı görünür olmalı.
 *  2. TOPLAM TAMAMLANMA YÜZDESİ TÜRETİLMEZ — faz yüzdeleri roadmap'in
 *     kendi beyanıdır ve öyle etiketlenir.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { expectRefreshWorks } from "@/features/shell/story-helpers";

import { SystemVersion } from "./screen";

const meta: Meta<typeof SystemVersion> = {
  title: "Screens/SystemVersion",
  component: SystemVersion,
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

type Story = StoryObj<typeof SystemVersion>;

export const Surum: Story = {
  name: "Çalışan sürüm — kirli ağaç gizlenmez",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Version" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of [
      "Çalışan sürüm",
      "Yönetişim envanteri",
      "Yol haritası",
    ]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 1: kirli ağaç uyarısı basılır. */
    await expect(canvas.getByText(/Çalışma ağacı KİRLİ/)).toBeInTheDocument();

    /* SINIR 2: her faz yüzdesi "roadmap beyanı" olarak etiketli;
       toplam bir tamamlanma sayısı yok. */
    await expect(canvas.getAllByText(/roadmap beyanı/)).toHaveLength(3);
    await expect(
      canvas.queryByText(/toplam tamamlanma|genel ilerleme/i)
    ).toBeNull();

    await expectRefreshWorks(canvas, "Version");
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <SystemVersion demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Version" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, faz bildirilmedi",
  render: () => <SystemVersion demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Version" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(await canvas.findByText("Faz bildirilmedi")).toBeInTheDocument();
    /* Sürüm bölümü boşalmaz: fazsız bir kurulum da bir commit çalıştırır. */
    await expect(canvas.getByText("mock123")).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep üç bölümde birden yazılır",
  render: () => <SystemVersion demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Version" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Sürüm bilgisi okunamadı")
        ).toHaveLength(3),
      { timeout: 15_000 }
    );
  },
};
