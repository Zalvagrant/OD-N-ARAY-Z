/**
 * System · Security story'leri — UI-ADR-209.
 *
 * Kilitlenen sınırlar:
 *  1. PUAN YOK — ekranda hiçbir 0-100 güvenlik sayısı yazamaz ve reddin
 *     GEREKÇESİ görünür olmalı.
 *  2. SIR İÇERİĞİ YOK — yalnız ad ve dolu/boş.
 *  3. BAĞLAMA ÖLÇÜM OLARAK ETİKETLENİR — "koddan varsayılmadı".
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { expectRefreshWorks } from "@/features/shell/story-helpers";

import { SystemSecurity } from "./screen";

const meta: Meta<typeof SystemSecurity> = {
  title: "Screens/SystemSecurity",
  component: SystemSecurity,
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

type Story = StoryObj<typeof SystemSecurity>;

export const Guvenlik: Story = {
  name: "Ölçülen olgular — puan üretilmez",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Security" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of [
      "Neden puan yok",
      "Saldırı yüzeyi",
      "Kimlik bilgileri",
      "Denetim izi",
      "Yönetişim kapısı",
    ]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 1: reddin gerekçesi görünür, puan yok. */
    await expect(canvas.getByText(/puan üretmek uydurma/)).toBeInTheDocument();
    await expect(canvas.queryByText(/\d\s*\/\s*100|güvenlik puanı/i)).toBeNull();

    /* SINIR 3: bağlama ölçüm olarak etiketli. */
    await expect(
      canvas.getByText("çalışan soketten ölçüldü")
    ).toBeInTheDocument();
    await expect(canvas.getByText("Yalnız loopback")).toBeInTheDocument();

    /* SINIR 2: boş anahtar adıyla bildirilir, içerik yok. */
    await expect(canvas.getByText(/BOŞ anahtar: mock-bos/)).toBeInTheDocument();

    /* Iskalanan adlar denetim izinden görünür. */
    await expect(
      canvas.getByText(/amazon-ads-region · 171/)
    ).toBeInTheDocument();

    await expectRefreshWorks(canvas, "Security");
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <SystemSecurity demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Security" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, kayıtlı anahtar yok",
  render: () => <SystemSecurity demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Security" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Kayıtlı anahtar yok")
    ).toBeInTheDocument();
    /* Bağlama boşaltılmaz: anahtarsız bir kurulum da bir adrese bağlıdır. */
    await expect(canvas.getByText("Yalnız loopback")).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep beş bölümde birden yazılır",
  render: () => <SystemSecurity demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Security" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Güvenlik olguları okunamadı")
        ).toHaveLength(5),
      { timeout: 15_000 }
    );
  },
};
