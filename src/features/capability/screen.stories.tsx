/**
 * Yetenek durumu story'leri — UI-ADR-206.
 *
 * Kilitlenen sınırlar:
 *  1. PLACEHOLDER CÜMLESİ YASAK — "henüz üretilmedi / kendi sprintinde"
 *     bu ekranda geçemez; yerine ÖLÇÜLMÜŞ gerekçe durur.
 *  2. KANIT GÖRÜNÜR — iddianın neye bakılarak yapıldığı ekranda.
 *  3. SAHTE METRİK YOK — sıfır, boş tablo, boş grafik çizilmez.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { CapabilityScreen } from "./screen";

const meta: Meta<typeof CapabilityScreen> = {
  title: "Screens/Capability",
  component: CapabilityScreen,
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
  args: {
    id: "system.backups",
    title: "Backups",
    context: "Yedek politikası — kaynak durumu ölçülmüştür",
  },
  decorators: [
    (Story) => (
      <div className="bg-bg p-6">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CapabilityScreen>;

export const OlculmusYokluk: Story = {
  name: "Ölçülmüş yokluk — gerekçe + kanıt",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Backups" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of ["Durum", "Neye bakıldı"]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 1: eski placeholder cümlesi ekranda GEÇEMEZ. */
    await expect(
      canvas.queryByText(/henüz üretilmedi|kendi sprintinde/i)
    ).toBeNull();

    /* Gerekçe ve gereklilik çekirdekten gelir ve görünür. */
    await expect(canvas.getByText(/arşiv yedek değildir/)).toBeInTheDocument();
    await expect(canvas.getByText(/Ne gerekiyor/)).toBeInTheDocument();

    /* SINIR 2: kanıt ekranda. */
    await expect(canvas.getByText(/backup-policy.json: YOK/)).toBeInTheDocument();
    await expect(canvas.getByText(/^Ölçüm:/)).toBeInTheDocument();

    /* SINIR 3: uydurulmuş sayı yok. */
    await expect(canvas.queryByRole("table")).toBeNull();
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: (args) => <CapabilityScreen {...args} demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Backups" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — çekirdek bu yeteneği tanımıyor",
  render: (args) => <CapabilityScreen {...args} demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Backups" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Bu yetenek çekirdekte tanımlı değil")
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep iki bölümde birden yazılır",
  render: (args) => <CapabilityScreen {...args} demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Backups" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Yetenek durumu okunamadı")
        ).toHaveLength(2),
      { timeout: 15_000 }
    );
  },
};
