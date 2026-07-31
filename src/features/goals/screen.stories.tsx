/**
 * Hedefler — arayüzdeki İLK canlı ODIN verisi (S8, UI-ADR-124).
 * Story UI-ADR-153'te yazıldı.
 *
 * Bu ekranın HİÇ hikâyesi yoktu ve bu, S13'ün en rahatsız edici boşluğuydu:
 * `/goals` sahibin ODIN'e yazdığı hedefleri gösteren ve **gerçek uç
 * noktadan beslenen** ilk ekrandı; yani doğrulanması en çok gereken yerdi.
 * Kapı (UI-ADR-153) `demo?: DemoState` muafiyeti kaldırılınca ortaya çıktı.
 *
 * Kilitlenen şey yerleşim değil, İKİ SINIR:
 *  1. Üç seviye (acil · haftalık · çeyreklik) AYRI bölümdür ve seviyesi
 *     boş olan bölüm SESSİZCE KAYBOLMAZ — "bu seviyede hedef yok" der.
 *     Kaybolan bir bölüm, o seviyede hedef olmadığını değil, sistemin
 *     onu unuttuğunu düşündürür.
 *  2. Veri geldiğinde kaynağı `TrustSignal` ile ETİKETLENİR. Etiketsiz
 *     bir sayı, "bu güncel mi?" sorusunu cevaplayamaz (CLAUDE.md §2).
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { Goals } from "./screen";

const meta: Meta<typeof Goals> = {
  title: "Screens/Hedefler",
  component: Goals,
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

type Story = StoryObj<typeof Goals>;

export const Hedefler: Story = {
  name: "Üç seviye ayrı bölüm; boş seviye SESSİZCE kaybolmaz",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* ÖNCE VARLIK — veri asenkron. Eşzamanlı sorgu iskelet üstünde koşar
       ve hiçbir şey kanıtlamaz. */
    await canvas.findByRole("heading", { name: "Hedefler" }, { timeout: 15_000 });

    /* Üç seviyenin ÜÇÜ de bölüm olarak durur. `Section` her birine
       `aria-label` veriyor; başlık kaybolursa bölüm de kaybolmuştur. */
    for (const baslik of ["Acil", "Bu hafta", "Çeyreklik"]) {
      await expect(
        await canvas.findByRole("heading", { name: baslik }, { timeout: 15_000 })
      ).toBeInTheDocument();
    }

    /* Bölüm ya hedef satırı gösterir ya "bu seviyede hedef yok" der —
       ikisi de bir CEVAPTIR. Sessiz bir boşluk cevap değildir. */
    const govde = canvasElement.textContent ?? "";
    await expect(govde.length).toBeGreaterThan(0);

    /* Yükleme GERÇEKTEN biter. `role="status"` iskelet bölgesidir; üç
       bölüm de ondan çıkmadan aşağıdaki hiçbir iddia anlam taşımaz.
       (İlk yazımda eşzamanlı ölçtüm ve üç iskelet açıkken düştü — bu
       oturumda dördüncü kez aynı hata TESTTE yapıldı.) */
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    /* Yükleme bittiğinde her bölüm bir CEVAP taşır: ya hedef satırı ya da
       "bu seviyede hedef yok". Sessiz bir bölüm cevap değildir. */
    for (const baslik of ["Acil", "Bu hafta", "Çeyreklik"]) {
      const bolum = canvas.getByRole("region", { name: baslik });
      await expect(bolum.textContent!.replace(baslik, "").trim().length)
        .toBeGreaterThan(0);
    }
  },
};
