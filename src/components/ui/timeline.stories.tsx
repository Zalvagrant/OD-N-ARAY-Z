/** S3 · 15 — Timeline */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Timeline, type TimelineItem } from "./timeline";

const ITEMS: TimelineItem[] = [
  {
    id: "1",
    at: "2026-07-28T09:12:00+03:00",
    title: "ACOS eşiği aşıldı",
    description: "LLU-HA-2024-BLK kampanyasında ACOS %38'e çıktı.",
    tone: "warning",
    actor: "Amazon Director",
  },
  {
    id: "2",
    at: "2026-07-28T09:14:00+03:00",
    title: "Öneri üretildi",
    description: "Bütçe %15 düşürülsün — 3 alternatifle birlikte.",
    tone: "ai",
    actor: "Amazon Director",
  },
  {
    id: "3",
    at: "2026-07-28T10:02:00+03:00",
    title: "Karar onaylandı",
    tone: "success",
    actor: "Sen",
  },
  {
    id: "4",
    at: null,
    title: "Eski kayıt",
    description: "Zaman damgası yok — 'az önce' UYDURULMAZ.",
    tone: "neutral",
  },
];

const meta: Meta<typeof Timeline> = {
  title: "Core/15 · Timeline",
  component: Timeline,
  parameters: { layout: "padded" },
};
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <Timeline items={ITEMS} />
    </div>
  ),
  /* `Selectable`ın karşı kutbu: `onSelect` YOKSA hiçbir satır tıklanabilir
     OLMAMALI. Koşul terse dönerse her satır işlevsiz bir butona dönüşür —
     klavye kullanıcısı dört kez Tab'lar ve dördünde de hiçbir şey olmaz. */
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole("button")).toHaveLength(0);
  },
};

export const Selectable: StoryObj<{ onSelect: (i: TimelineItem) => void }> = {
  args: { onSelect: fn() },
  render: (args) => (
    <div className="max-w-lg">
      <Timeline items={ITEMS} onSelect={args.onSelect} />
    </div>
  ),
  /**
   * BAĞLAMA TESTİ — UI-ADR-187, yazılımcılar meclisinin (terra) itirazı.
   *
   * İlk turda buraya "gerek yok" demiştim: `Pressable`ın Tab/Enter/Space
   * sözleşmesi `pressable.stories.tsx`te zaten testli. terra itiraz etti
   * ve HAKLIYDI — üstelik kendi argümanımla: `Section`ın `onRetry`ı
   * İLETMESİNİ test etmeyi kabul etmiştim, ama aynı mantığı buraya
   * uygulamamıştım. Primitive'in testi şunların HİÇBİRİNİ kanıtlamaz:
   *
   *   1. `onSelect` verilmediğinde satırın SARILMADIĞI (aşağıda `Default`),
   *   2. geri çağrıya DOĞRU NESNENİN geçtiği — indeks ya da yanlış öğe
   *      geçseydi sağ panel BAŞKA bir olayın detayını açardı ve sayı
   *      makul göründüğü için kimse sorgulamazdı,
   *   3. erişilebilir adın KİMLİK değil BAŞLIK olduğu (UI-ADR-161).
   *
   * Üçüncüsü özellikle önemli: axe adın VAR olduğunu görür, ANLAMLI
   * olduğunu göremez. "evt-4821, buton" diye okunan bir satır her a11y
   * kapısından geçer ve ekran okuyucu kullanıcısına hiçbir şey söylemez.
   */
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    const satirlar = c.getAllByRole("button");
    await expect(satirlar).toHaveLength(ITEMS.length);

    /* Ad = "aktör: başlık" — kimlik DEĞİL. */
    await expect(satirlar[0]).toHaveAccessibleName(
      "Amazon Director: ACOS eşiği aşıldı"
    );
    /* Aktörü olmayan öğede yalnız başlık kalır, "Olay 4" değil. */
    await expect(satirlar[3]).toHaveAccessibleName("Eski kayıt");

    await userEvent.click(satirlar[1]);
    /* Geçen şey ÖĞENİN KENDİSİ — indeks ya da id değil. */
    await expect(args.onSelect).toHaveBeenCalledWith(ITEMS[1]);
  },
};

export const Loading: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <Timeline items={[]} loading />
    </div>
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <div className="max-w-lg">
      <Timeline items={[]} />
    </div>
  ),
};
