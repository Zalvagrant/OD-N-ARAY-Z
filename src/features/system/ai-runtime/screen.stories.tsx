/**
 * System · AI Runtime story'leri — UI-ADR-205.
 *
 * Kilitlenen sınırlar (meclis 2/2):
 *  1. "0,00 USD" YAZILAMAZ — bilinmeyen maliyet sıfır değildir.
 *  2. BAŞARI ORANI TÜRETİLMEZ — çağrı ve hata ham, yan yana.
 *  3. Fiyatsız çağrı SAYILIR ve öyle etiketlenir.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { expectRefreshWorks } from "@/features/shell/story-helpers";

import { SystemAiRuntime } from "./screen";

const meta: Meta<typeof SystemAiRuntime> = {
  title: "Screens/SystemAiRuntime",
  component: SystemAiRuntime,
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

type Story = StoryObj<typeof SystemAiRuntime>;

export const AiRuntime: Story = {
  name: "Kullanım + maliyet bilinmiyor — sıfır yazmaz",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole(
      "heading",
      { name: "AI Runtime" },
      { timeout: 15_000 }
    );
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of [
      "Kullanım",
      "Maliyet",
      "Modeller",
      "Sağlayıcılar",
      "Son çağrılar",
    ]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 1: maliyet sıfır olarak BASILMAZ, sebebi basılır. */
    await expect(
      canvas.getByRole("note", { name: "Hiçbir çağrı fiyat bildirmedi" })
    ).toBeInTheDocument();
    await expect(canvas.queryByText(/0,00\s*USD|\$0/)).toBeNull();

    /* SINIR 3: fiyatsız çağrı sayılır. */
    await expect(canvas.getByText(/tahmin edilmiyor/)).toBeInTheDocument();

    /* SINIR 2: hiçbir yerde türetilmiş bir YÜZDE yok. Metin araması
       kullanılamaz — bölümün AÇIKLAMASI zaten "başarı oranı türetilmez"
       diyor ve çıplak bir /başarı oranı/ araması kendi vaadini yakalayıp
       kapıyı yanlış yerden kırmızıya çeviriyordu (ilk koşum). Aranan şey
       RAKAMLI yüzde. */
    await expect(canvas.queryByText(/\d\s*%|%\s*\d/)).toBeNull();
    await expect(
      canvas.getByText(/başarı oranı türetilmez/)
    ).toBeInTheDocument();

    /* BUTON GERÇEKTEN ÇALIŞIYOR: tıklanır ve ekran veri
       durumunda kalır (UI-ADR-207). Varlık, çalıştığını kanıtlamaz. */
    await expectRefreshWorks(canvas, "AI Runtime");
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <SystemAiRuntime demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "AI Runtime" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, hiç model çağrılmadı",
  render: () => <SystemAiRuntime demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "AI Runtime" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Hiç model çağrılmadı")
    ).toBeInTheDocument();
    /* Sağlayıcı listesi BOŞALMAZ: anahtar var ama çağrı yok, tam da
       bu ekranın göstermesi gereken durum. */
    await expect(canvas.getByText(/nvidia · anahtar var/)).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep beş bölümde birden yazılır",
  render: () => <SystemAiRuntime demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "AI Runtime" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("AI çalışma zamanı okunamadı")
        ).toHaveLength(5),
      { timeout: 15_000 }
    );
  },
};
