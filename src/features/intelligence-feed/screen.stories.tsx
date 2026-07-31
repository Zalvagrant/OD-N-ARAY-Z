/**
 * Executive Intelligence Feed — sağ panelin Briefing'deki içeriği.
 * Story UI-ADR-153'te yazıldı.
 *
 * Bu ekranın HİÇ hikâyesi yoktu: `/briefing` açıkken sağ panelde her gün
 * görünen bir yüzey, yalnız gözle doğrulanabiliyordu. Kapı (UI-ADR-153)
 * `demo?: DemoState` muafiyeti kaldırılınca ortaya çıktı — bu ekran o
 * prop'u almadığı için matristen sessizce muaftı.
 *
 * Kilitlenen şey yerleşim değil, İKİ SINIR: yüklenirken sayı/kayıt
 * gösterilmez, ve akış sınırı (`maxVisible`) gerçekten uygulanır —
 * "Attention Economy" kuralı (05-dashboard.md §6) bastırmayı bilen
 * katmanın bastırmasını ister.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { IntelligenceFeed } from "./screen";

const meta: Meta<typeof IntelligenceFeed> = {
  title: "Screens/Intelligence Feed",
  component: IntelligenceFeed,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      /* Sağ panelin gerçek genişliği. Geniş bırakmak dar kolonda çıkan
         taşmaları gizlerdi. */
      <div className="w-96 bg-bg-secondary p-3">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof IntelligenceFeed>;

export const Akis: Story = {
  name: "Akış — kaynak etiketi ve sınır birlikte çalışır",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText("Intelligence Feed", {}, { timeout: 15_000 });

    /* AKIŞIN GELMESİNİ BEKLE. Fixture asenkron çözülüyor; eşzamanlı sorgu
       iskelet üstünde koşar ve hiçbir şey kanıtlamaz. (Bu oturumda aynı
       hataya üç kez düşüldü — kural: yokluk iddiası VARLIKTAN sonra.) */
    await canvas.findAllByRole("listitem", {}, { timeout: 15_000 });

    /* STABİLİZE OL, SONRA SAY. `findAllByRole` İLK öğe göründüğü an
       çözülür; oradaki sayıya bakmak sınırın uygulandığını kanıtlamaz —
       liste büyümeye devam ediyor olabilir. İki ardışık ölçüm aynı
       gelene kadar bekleyip ondan sonra sayıyoruz. */
    let onceki = -1;
    await waitFor(
      () => {
        const n = canvas.queryAllByRole("listitem").length;
        const durgun = n === onceki;
        onceki = n;
        expect(durgun).toBe(true);
      },
      { timeout: 15_000, interval: 120 }
    );
    const satirlar = canvas.queryAllByRole("listitem");

    /* Veri MOCK olduğu sürece bunu SÖYLEMEK zorunda: `MockBadge` bu
       ekranın tek dürüstlük işareti. Kaybolursa mock veri gerçek sanılır
       (UI-ADR-094 · CLAUDE.md §2). `getAllByText` çünkü "mock" hem
       rozette hem satır kaynak etiketinde geçiyor. */
    await expect(canvas.getAllByText(/mock/i).length).toBeGreaterThan(0);

    /* AKIŞ SINIRI GERÇEKTEN UYGULANIR. `maxVisible={6}` bir sunum
       tercihidir ve bastırmayı bilen katman bastırır (05-...md §6);
       sınırsız bir akış, dikkat ekonomisini sessizce bozar. */
    await expect(satirlar.length).toBeLessThanOrEqual(6);
    await expect(satirlar.length).toBeGreaterThan(0);
  },
};
