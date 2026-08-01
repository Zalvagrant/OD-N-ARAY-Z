/**
 * LoadingState — UI-ADR-174 (kurul kararı, gavadolar 2/2).
 *
 * Bu bileşenin HİÇ hikâyesi yoktu ve envanter kapısı da susuyordu, çünkü
 * o kapı yalnız **tüketicisi olmayan** bileşenlerden hikâye ister;
 * `LoadingState`in tüketicisi var. Kurulun tespiti: *"tüketicisi olsa da
 * ortak ve kullanıcıya görünür bir durum primitifi olarak bağımsız
 * görsel kanıtı eksik."*
 *
 * Bu ayrım önemli: "yükleniyor" bir SÜSLEME değil, üç ayrı ifadeden
 * biridir (UI-ADR-151) — *"yükleniyor" ≠ "ölçüldü, sonuç boş" ≠
 * "ÖLÇÜLMEDİ"*. Ekranların yarısı bu bileşene o ifadeyi devrediyor;
 * devredilen bir ifadenin kendi kanıtı olmalı.
 *
 * Kilitlenen iki sınır:
 *  1. İskelet ekran okuyucuya DUYURULUR ve adı ÇAĞIRANDAN gelir —
 *     "Yükleniyor" diye genel bir ses, altı farklı bölge yüklenirken
 *     hangisinin beklediğini söylemez.
 *  2. `count` GERÇEKTEN yerleşimi belirler — skeleton'ın tek işi
 *     gelecek içeriğin YERİNİ tutmaktır; sayı tutmuyorsa içerik
 *     geldiğinde layout kayar ve bileşenin var oluş sebebi düşer.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { LoadingState } from "./loading-state";

const meta: Meta<typeof LoadingState> = {
  title: "UI/LoadingState",
  component: LoadingState,
};
export default meta;

type Story = StoryObj<typeof LoadingState>;

export const AdCagirandanGelir: Story = {
  name: "İskelet DUYURULUR ve adı çağırandan gelir",
  render: () => (
    <div className="flex flex-col gap-6">
      <LoadingState layout="list" count={3} label="İstihbarat akışı yükleniyor" />
      <LoadingState layout="kpi" count={2} label="Göstergeler yükleniyor" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* İKİ AYRI BÖLGE, İKİ AYRI AD. Aynı sayfada iki şey yüklenirken
       ikisinin de "Yükleniyor" demesi, ekran okuyucu kullanıcısına
       hangisinin beklediğini söylemez.

       ⚠️ `getByRole("status", { name })` KULLANILMAZ ve bunu bu oturumda
       İKİNCİ kez öğrendim: `status` bir "name from content" rolü
       DEĞİLDİR, adı alt ağaçtaki metinden gelmez. `SkeletonRegion`
       etiketi bir `sr-only` span olarak basıyor — duyurulan şey odur ve
       aranacak şey de odur. */
    /* ⚠️ KURUL `toHaveAccessibleName` ÖNERDİ — DENENDİ VE DÜŞTÜ.
       `role="status"` bir "name from content" rolü DEĞİLDİR ve
       `SkeletonRegion` `aria-label` basmıyor; erişilebilir ad BOŞ
       (ölçüldü: iddia "Expected element to have accessible name" ile
       kırmızı verdi). Bir CANLI BÖLGE için doğrusu da budur — ekran
       okuyucu bölgeye ad vermez, İÇERİĞİNİ duyurur. O yüzden aranan şey
       duyurulan metnin ta kendisidir.
       `aria-label` eklemek bölgeye ad verirdi ama gerçek bir ekran
       okuyucuyla çift duyuru yapıp yapmayacağını burada ölçemem —
       ölçemediğim bir iyileştirmeyi paylaşılan bir primitife
       uygulamıyorum (kural 2'nin aynısı: kanıtsız iddia yazılmaz). */
    const bolgeler = canvas.getAllByRole("status");
    await expect(bolgeler).toHaveLength(2);
    await expect(canvas.getByText("İstihbarat akışı yükleniyor")).toBeInTheDocument();
    await expect(canvas.getByText("Göstergeler yükleniyor")).toBeInTheDocument();

    /* Ve bölge YÜKLENDİĞİNİ söyler: `aria-busy` olmadan ekran okuyucu
       burayı yalnızca "boş bir alan" diye geçer. */
    for (const b of bolgeler) await expect(b).toHaveAttribute("aria-busy", "true");
  },
};

export const CountYerlesimiBelirler: Story = {
  name: "count — skeleton GELECEK içeriğin yerini tutar",
  render: () => (
    <LoadingState layout="list" count={6} label="Altı satır yükleniyor" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bolge = canvas.getByRole("status");

    /* ALTI satır ister, ALTI satır çizer. Skeleton'ın tek işi yer
       tutmaktır; sayı tutmazsa içerik geldiğinde layout kayar ve
       spinner yerine skeleton kullanmanın gerekçesi ortadan kalkar
       (`loading-state.tsx` başlığı bunu vaat ediyor).

       ⚠️ İLK YAZIMDA `.border-line-subtle` SINIFINI sayıyordu ve kurul
       haklı olarak kırılgan buldu: görsel bir refactor, davranış hiç
       değişmeden testi düşürürdü. Kanca artık açık (`data-slot`). */
    const satirlar = bolge.querySelectorAll('[data-slot="loading-state-line"]');
    await expect(satirlar).toHaveLength(6);

    /* Ve satırlar DEKORATİF: ekran okuyucuya altı boş kutu okutmak,
       "yükleniyor" demekten daha kötüdür. */
    for (const s of satirlar) await expect(s).toHaveAttribute("aria-hidden", "true");
  },
};
