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

/* --------------------------------------------------------------------------
   DURUM MATRİSİ — UI-ADR-172
   -------------------------------------------------------------------------- */

/**
 * Bu ekranın TEK story'si vardı: veri geldiğinde ne çizdiği. Oysa hata
 * dalı KODDA VARDI ve hiç uyandırılmıyordu — çizilen ama hiç görülmemiş
 * bir yol, olmayan yoldan farksızdır.
 *
 * Kilitlenen ayrım UI-ADR-151'in ayrımıdır ve bu ekranda özellikle
 * keskindir: **"ölçülmedi" ≠ "ölçüldü, hedef yok".** Sahibin hiç hedef
 * yazmamış olması ile ODIN'in cevap verememesi aynı ekranı üretmemeli.
 */
export const Yukleniyor: Story = {
  name: "loading — iskelet basılır, boş cevap DEĞİL",
  render: () => <Goals demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Hedefler" }, { timeout: 15_000 });

    /* İskelet bölgesi DURUR. Yüklenirken "bu seviyede hedef yok" yazmak,
       henüz sorulmamış bir soruya cevap uydurmaktır. */
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
    await expect(canvas.queryByText("Bu seviyede hedef yok.")).toBeNull();
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, hedef yok: üç bölüm de cevap verir",
  render: () => <Goals demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Hedefler" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    /* ÜÇÜ DE konuşur. Bir seviyenin sessizce kaybolması, o seviyede hedef
       olmadığını değil, sistemin onu unuttuğunu düşündürür — bu ekranın
       ilk story'sinin kilitlediği sınırın boş durumdaki karşılığı. */
    await expect(canvas.getAllByText("Bu seviyede hedef yok.")).toHaveLength(3);
  },
};

export const Hata: Story = {
  name: "error — sebep YAZILIR, boş bölüm gösterilmez",
  render: () => <Goals demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Hedefler" }, { timeout: 15_000 });

    /* Hata SEBEBİYLE ve ÜÇ BÖLÜMDE BİRDEN görünür. `Section` `what`ı
       basar; sebepsiz bir hata kullanıcıya "bir şeyler ters gitti"
       demekten ibarettir ve bu repoda kaynağı uydurulmuş bir iddia
       sayılır. Üç olması tesadüf değil: hata ekran seviyesindedir, yani
       hiçbir seviye "benim verim geldi" izlenimi vermez. (İlk yazımda
       tekil aradım ve düştü — kapı kendi iddiamı düzeltti.) */
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Hedefler yüklenemedi")
        ).toHaveLength(3),
      { timeout: 15_000 }
    );

    /* VE boş cevap AYNI ANDA gösterilmez: "hedef yok" ile "soramadım"
       aynı ekranda çelişir. */
    await expect(canvas.queryByText("Bu seviyede hedef yok.")).toBeNull();
  },
};
