/**
 * Amazon · PPC story'leri — UI-ADR-197.
 *
 * Kilitlenen sınırlar:
 *  1. Katman 1 (toplam reklam KPI'ları) gerçek zarftan çizilir.
 *  2. Kampanya kırılımı FAIL-CLOSED: ODIN yayınlamıyor → "üretilmedi"
 *     yazılır. Arayüz 94 satırlık KO'dan kendi kırılımını ÜRETMEZ —
 *     çekirdeğin yapmadığı değerlendirme arayüzde icat edilmez.
 *  3. empty = "ölçüldü, özet yok": Katman 1 de dürüst yokluğa düşer.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { AmazonPpc } from "./screen";

const meta: Meta<typeof AmazonPpc> = {
  title: "Screens/AmazonPpc",
  component: AmazonPpc,
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

type Story = StoryObj<typeof AmazonPpc>;

export const Ppc: Story = {
  name: "Katman 1 gerçek zarf; kampanya kırılımı fail-closed",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "PPC" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    /* Katman 1 kartı gerçek zarftan çizilir. */
    await expect(
      canvas.getByText("Executive PPC Overview")
    ).toBeInTheDocument();

    /* SINIR 2: kampanya kırılımı yayınlanmıyor ve ÜRETİLMİYOR. Gerekçe
       NoData'nın aria-label'ında yaşar (UI-ADR-156) — metin değil, ROL
       ile sorgulanır. */
    await expect(
      canvas.getByRole("note", { name: "Kampanya analizi üretilmedi" })
    ).toBeInTheDocument();
    /* Neden açık: sözleşme yok, talep kayıtlı. */
    await expect(
      canvas.getByText(/kampanya kırılımı yayınlamıyor/)
    ).toBeInTheDocument();
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <AmazonPpc demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "PPC" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ölçüldü, özet yok: Katman 1 de dürüst yokluğa düşer",
  render: () => <AmazonPpc demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "PPC" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByRole("note", { name: "PPC özeti üretilmedi" })
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep iki bölümde birden yazılır",
  render: () => <AmazonPpc demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "PPC" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("PPC özeti okunamadı")
        ).toHaveLength(2),
      { timeout: 15_000 }
    );
  },
};
