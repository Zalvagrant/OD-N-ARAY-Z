/**
 * System · Storage story'leri — UI-ADR-200.
 *
 * Kilitlenen sınırlar:
 *  1. PROJEKSİYON YOK — "şu kadar gün sonra dolar / kalan gün" yazılmaz.
 *     Ölçülen hız ve ölçülen boş alan yan yana durur.
 *  2. Büyüme hızı ÖLÇÜMDÜR: gözlem penceresi de ekranda yazılıdır.
 *  3. Disk doluluğu ODIN'in değil DİSKİN tamamıdır ve öyle etiketlenir.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { SystemStorage } from "./screen";

const meta: Meta<typeof SystemStorage> = {
  title: "Screens/SystemStorage",
  component: SystemStorage,
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

type Story = StoryObj<typeof SystemStorage>;

export const Depolama: Story = {
  name: "Envanter + ölçülen büyüme — projeksiyon yok",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Storage" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of ["Toplam", "Büyüyen günlükler", "Dizin dökümü"]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 2: hız ölçüm olarak sunulur, gözlem penceresiyle birlikte. */
    await expect(canvas.getAllByText(/MB\/gün/).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText(/günlük gözlem/).length).toBeGreaterThan(0);

    /* SINIR 1: hiçbir yerde tahmin/geri sayım yok. */
    await expect(canvas.queryByText(/dolar|kalan gün|tahmin/i)).toBeNull();

    /* SINIR 3: doluluk kimin diye yazılı. */
    await expect(
      canvas.getByText("ODIN'in değil, diskin tamamı")
    ).toBeInTheDocument();
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <SystemStorage demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Storage" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, veri dizini boş",
  render: () => <SystemStorage demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Storage" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Veri dizini boş")
    ).toBeInTheDocument();
    /* Disk ölçümü boş veri diziniyle geçersizleşmez — yerinde durur. */
    await expect(
      canvas.getByText("ODIN'in değil, diskin tamamı")
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep üç bölümde birden yazılır",
  render: () => <SystemStorage demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Storage" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Depolama envanteri okunamadı")
        ).toHaveLength(3),
      { timeout: 15_000 }
    );
  },
};
