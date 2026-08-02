/**
 * Finance ekranı story'leri — UI-ADR-195.
 *
 * Kilitlenen sınırlar:
 *  1. PARA BİRİMİ İZOLASYONU: ekrandaki her tutar ODIN'in bildirdiği
 *     birimde basılır; USD gelir/marj bu ekranda HİÇ yoktur (gavadolar
 *     2/2 — iki birimi aynı ekranda toplamak en tehlikeli hata sınıfı).
 *  2. `operating_net` ile `cash_flow_net` AYRI satırdır ve ikisine de
 *     "net kâr" denmez — ODIN'in ayrımı ekranda korunur.
 *  3. Runway ile hedefi HAM yan yana durur; arayüz kıyası
 *     renklendirmez, hüküm üretmez (UI-ADR-111).
 *  4. Bağlı olmayan kaynaklar ADIYLA listelenir — eksikliğin kendisi
 *     ölçümdür, gizlenmez.
 *
 * `empty` beyan edilmiyor: pozisyon tek nesnedir, cockpit "defter boş"u
 * `null` yayınlar ve o dal sebepli HATA olarak çizilir.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { Finance } from "./screen";

const meta: Meta<typeof Finance> = {
  title: "Screens/Finance",
  component: Finance,
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

type Story = StoryObj<typeof Finance>;

export const Pozisyon: Story = {
  name: "Defter pozisyonu — TRY tutarlar, ayrım korunur, eksik kaynak listelenir",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Finance" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    /* Beş bölüm de durur. */
    for (const baslik of [
      "Nakit pozisyonu",
      "Aylık akış",
      "Runway ve borç",
      "Zorunlu rezerv",
      "Bağlı olmayan kaynaklar",
    ]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 2: iki net AYRI satır ve ikisi de "net kâr" DEĞİL. */
    await expect(canvas.getByText("İşletme neti")).toBeInTheDocument();
    await expect(canvas.getByText("Nakit akışı neti")).toBeInTheDocument();
    await expect(canvas.queryByText(/^Net kâr/)).toBeNull();
    await expect(
      canvas.getByText(/Borç servisi ÖNCESİ — net kâr değildir/)
    ).toBeInTheDocument();

    /* SINIR 1: mock TRY yayınlıyor → ekranda ₺ biçimi var, $ YOK.
       (Kur çevirisi yapılsaydı USD kaynak tutarı dolar olarak sızardı.) */
    const govde = canvasElement.textContent ?? "";
    await expect(govde).toContain("₺");
    await expect(govde).not.toContain("$");

    /* SINIR 3: runway ve hedef ham yan yana. */
    await expect(canvas.getByText("Runway")).toBeInTheDocument();
    await expect(canvas.getByText("Runway hedefi")).toBeInTheDocument();

    /* SINIR 4: bağlı olmayan kaynaklar adıyla listelenir. */
    await expect(canvas.getByText(/tax — bağlı değil/)).toBeInTheDocument();
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır, sayı uydurulmaz",
  render: () => <Finance demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Finance" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
    /* Yüklenirken tek bir tutar bile basılmaz. */
    await expect(canvasElement.textContent ?? "").not.toContain("₺");
  },
};

export const Hata: Story = {
  name: "error — sebep beş bölümde birden yazılır, tutar basılmaz",
  render: () => <Finance demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Finance" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Finans pozisyonu yüklenemedi")
        ).toHaveLength(5),
      { timeout: 15_000 }
    );
    await expect(canvasElement.textContent ?? "").not.toContain("₺");
  },
};
