/**
 * Memory story'leri — UI-ADR-201.
 *
 * Kilitlenen sınırlar:
 *  1. ORAN YOK — "öneri" ve "karar verilmiş" ham ve yan yana; ekranda
 *     hiçbir yerde yüzde/skor yazmaz (UI-ADR-111).
 *  2. FİLTRE YOK — her verdict GEREKÇESİYLE listelenir; gerekçe alanı
 *     gizlenemez, boşsa "yazılmadı" der.
 *  3. Ders bölümü boşsa SEBEBİ yazılır (davranış modeli neden boş).
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { Memory } from "./screen";

const meta: Meta<typeof Memory> = {
  title: "Screens/Memory",
  component: Memory,
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

type Story = StoryObj<typeof Memory>;

export const Hafiza: Story = {
  name: "Hafıza + karar geçmişi — gerekçe her satırda",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Memory" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of [
      "Hafızanın büyüklüğü",
      "Öneriler neyden doğdu",
      "Sahibin karar geçmişi",
      "Öğrenilen dersler",
    ]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 2: gerekçe görünür. */
    await expect(canvas.getAllByText(/Gerekçe:/).length).toBeGreaterThan(0);

    /* SINIR 1: türetilmiş oran/skor yok. Sınırlar KELİME sınırıdır:
       çıplak `/yüzde/` "bu YÜZDEn boş" cümlesini yakalayıp kapıyı yanlış
       yerden kırmızıya çeviriyordu (ilk koşum). */
    await expect(
      canvas.queryByText(/\d\s*%|%\s*\d|\byüzde\b|\bskor\b/i)
    ).toBeNull();

    /* SINIR 3: ders yoksa sebebi yazılı. */
    await expect(
      canvas.getByText(/davranış modeli bu yüzden boş/i)
    ).toBeInTheDocument();
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <Memory demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Memory" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, hafıza boş",
  render: () => <Memory demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Memory" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(await canvas.findByText("Hafıza boş")).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep dört bölümde birden yazılır",
  render: () => <Memory demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Memory" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Yönetici hafızası okunamadı")
        ).toHaveLength(4),
      { timeout: 15_000 }
    );
  },
};
