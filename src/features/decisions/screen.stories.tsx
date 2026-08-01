/**
 * Decision Center — 06-workspaces.md §2.
 *
 * Bu ekranın adı en tehlikeli yanlışı davet ediyor: gösterdiği şey KARAR
 * DEĞİL, karara bağlanmayı bekleyen ÖNERİDİR. `/api/state.decisions`
 * (yönetilen karar kayıtları) bugün BOŞ; bir öneriyi karar diye çizmek,
 * sahibin vermediği kararı vermiş göstermek olurdu.
 *
 * İkinci sınır: tekrar sayısı bilgidir, aciliyet değil. 696 kez yazılmış
 * bir uyarı gösterilir ama ondan bir "acil" hükmü TÜRETİLMEZ.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { DecisionCenter } from "./screen";

const meta: Meta<typeof DecisionCenter> = {
  title: "Screens/Decision Center",
  component: DecisionCenter,
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

type Story = StoryObj<typeof DecisionCenter>;

export const Kuyruk: Story = {
  name: "öneri KARAR diye sunulmaz; tekrar sayısı görünür",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole(
      "heading",
      { name: "Decision Center" },
      { timeout: 15_000 }
    );
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    /* ÖNCE VARLIK — öneri metni ve sahip onayı rozeti çizilir. */
    await expect(
      canvas.getByText("29 SKU kritik stokta — yeniden siparis penceresi")
    ).toBeInTheDocument();
    await expect(canvas.getByText("sahip onayı gerekli")).toBeInTheDocument();

    /* ASIL İDDİA 1 — tekrar sayısı GİZLENMEZ. */
    await expect(canvas.getByText(/696 kez yazıldı/)).toBeInTheDocument();

    /* ASIL İDDİA 2 — ekran bunlara "karar" DEMEZ. Bölüm başlığı
       "Karar bekleyenler"dir; "Kararlar" başlığı çıkarsa, henüz
       verilmemiş kararlar verilmiş gibi okunur. */
    await expect(
      canvas.getByRole("heading", { name: "Karar bekleyenler" })
    ).toBeInTheDocument();
    await expect(canvas.queryByRole("heading", { name: "Kararlar" })).toBeNull();

    /* ASIL İDDİA 3 — gerekçesi olmayan öneri gerekçe UYDURMAZ. */
    await expect(
      canvas.getAllByRole("note", { name: "ODIN bu öneri için gerekçe kaydetmedi" })
        .length
    ).toBeGreaterThan(0);
  },
};

/* --------------------------------------------------------------------------
   DURUM MATRİSİ
   -------------------------------------------------------------------------- */

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır, boş kuyruk DEĞİL",
  render: () => <DecisionCenter demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole(
      "heading",
      { name: "Decision Center" },
      { timeout: 15_000 }
    );
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
    await expect(canvas.queryByText("Bekleyen öneri yok")).toBeNull();
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, bekleyen öneri yok",
  render: () => <DecisionCenter demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Bekleyen öneri yok", undefined, {
        timeout: 15_000,
      })
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — okunamadı; kuyruk boş DEĞİL",
  render: () => <DecisionCenter demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Karar kuyruğu okunamadı", undefined, {
        timeout: 15_000,
      })
    ).toBeInTheDocument();
    await expect(canvas.queryByText("Bekleyen öneri yok")).toBeNull();
  },
};
